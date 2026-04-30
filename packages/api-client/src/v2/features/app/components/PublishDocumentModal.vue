<script lang="ts">
/**
 * Modal that walks the user through publishing a brand-new document to
 * the registry.
 *
 * The component is purely presentational: it owns the form state, the
 * loading / error indicator and the validation rules, and delegates the
 * actual publish call to the parent through `submit`. The parent
 * resolves `submit` with `{ ok: true }` to close the modal or
 * `{ ok: false, message }` to surface the error inline so the user can
 * fix the input and retry without losing what they typed.
 */
export default {}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarListbox,
  ScalarModal,
  useLoadingState,
  type ModalState,
  type ScalarListboxOption,
} from '@scalar/components'
import { slugify } from '@scalar/helpers/string/slugify'
import { ScalarIconBuildings, ScalarIconCaretDown } from '@scalar/icons'
import { computed, ref, watch } from 'vue'

import type { RegistryNamespacesState } from '@/v2/types/configuration'

const {
  state,
  namespaces,
  defaultSlug = '',
  defaultVersion = '1.0.0',
} = defineProps<{
  /** Modal control returned by `useModal()`. */
  state: ModalState
  /** Namespaces the user can publish into, with loading status. */
  namespaces: RegistryNamespacesState
  /**
   * Initial slug to seed the slug input with. The parent typically
   * computes this from the active document's title. Falls back to an
   * empty string so the placeholder is visible.
   */
  defaultSlug?: string
  /**
   * Initial version. Defaults to `1.0.0` when the active document does
   * not advertise an `info.version` yet.
   */
  defaultVersion?: string
}>()

const emit = defineEmits<{
  /**
   * Fired when the user submits a valid form. The parent must resolve
   * the returned promise with either `{ ok: true }` (modal closes) or
   * `{ ok: false, message }` (message is rendered inline so the user
   * can retry).
   */
  (
    event: 'submit',
    payload: {
      input: { namespace: string; slug: string; version: string }
      done: (outcome: { ok: true } | { ok: false; message: string }) => void
    },
  ): void
}>()

const namespaceOptions = computed<ScalarListboxOption[]>(() =>
  (namespaces.status === 'success'
    ? namespaces.namespaces
    : (namespaces.namespaces ?? [])
  ).map((entry) => ({
    id: entry.namespace,
    label: entry.title?.trim() || entry.namespace,
  })),
)

const isNamespacesLoading = computed(() => namespaces.status === 'loading')

/**
 * The picker component is only rendered when there is more than one
 * namespace to choose between. Single-namespace setups read as a static
 * label so the user does not have to interact with a one-item dropdown.
 */
const hasMultipleNamespaces = computed(() => namespaceOptions.value.length > 1)

const selectedNamespace = ref<ScalarListboxOption | undefined>(undefined)
const slug = ref('')
const version = ref('')
const errorMessage = ref<string | null>(null)
const loader = useLoadingState()

/**
 * Resets the form whenever the modal opens. Keeping this scoped to the
 * `open` flag (and not to every prop change) preserves user input
 * across reactive updates while the modal is already on screen.
 */
watch(
  () => state.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    slug.value = slugify(defaultSlug)
    version.value = defaultVersion
    errorMessage.value = null
    selectedNamespace.value = namespaceOptions.value[0]
    void loader.clear()
  },
)

/** Keep the listbox selection in sync when the namespace list arrives. */
watch(namespaceOptions, (options) => {
  if (selectedNamespace.value) {
    return
  }
  selectedNamespace.value = options[0]
})

const trimmedSlug = computed(() => slug.value.trim())
const trimmedVersion = computed(() => version.value.trim())

/**
 * Human-friendly preview of the resulting registry coordinate
 * (`namespace/slug@version`). Returns `null` while any of the three
 * pieces is still missing so we never show a half-rendered path.
 * Mirrors the same fields submitted to the publish call so the user
 * sees exactly what will land on the registry.
 */
const publishPreview = computed<string | null>(() => {
  const namespace = selectedNamespace.value?.id
  if (!namespace || !trimmedSlug.value || !trimmedVersion.value) {
    return null
  }
  return `${namespace}/${trimmedSlug.value}@${trimmedVersion.value}`
})

const isSubmitDisabled = computed(
  () =>
    !selectedNamespace.value ||
    trimmedSlug.value.length === 0 ||
    trimmedVersion.value.length === 0 ||
    loader.isLoading,
)

const handleSubmit = (): void => {
  errorMessage.value = null

  const namespace = selectedNamespace.value?.id
  if (!namespace || !trimmedSlug.value || !trimmedVersion.value) {
    return
  }

  loader.start()

  emit('submit', {
    input: {
      namespace: String(namespace),
      slug: trimmedSlug.value,
      version: trimmedVersion.value,
    },
    done: (outcome) => {
      if (outcome.ok) {
        void loader.clear()
        state.hide()
        return
      }
      errorMessage.value = outcome.message
      void loader.invalidate()
    },
  })
}
</script>

<template>
  <ScalarModal
    size="sm"
    :state="state"
    title="Publish to registry"
    variant="form">
    <form
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit">
      <!--
        Namespace picker.

        All three states (single namespace, multiple namespaces, loading)
        render into a bordered field of the same height as the inputs
        below so the modal reads as one cohesive form. A leading
        `Buildings` icon anchors the namespace context visually so the
        single-value state does not look like loose plain text.

        - One namespace -> read-only field with the namespace label and
          a "fixed" hint, so the user understands there is nothing to
          pick without staring at a one-item dropdown.
        - Multiple namespaces -> dropdown listbox.
        - Loading -> the same field shape with a skeleton-style label
          so layout does not shift once the list arrives.
      -->
      <div class="flex flex-col gap-1.5">
        <label class="text-c-1 text-xs font-medium">Namespace</label>
        <template v-if="isNamespacesLoading && namespaceOptions.length === 0">
          <div
            class="border-border bg-b-2 flex h-8 items-center gap-2 rounded border px-3 text-sm">
            <ScalarIconBuildings
              class="text-c-3 size-3.5 shrink-0"
              size="sm"
              thickness="1.5" />
            <span class="text-c-3">Loading namespaces…</span>
          </div>
        </template>
        <template v-else-if="hasMultipleNamespaces">
          <ScalarListbox
            v-model="selectedNamespace"
            :options="namespaceOptions"
            teleport>
            <ScalarButton
              class="border-border text-c-1 hover:bg-b-2 flex h-8 w-full items-center justify-between gap-2 rounded border px-3 font-normal"
              fullWidth
              type="button"
              variant="outlined">
              <span class="flex min-w-0 items-center gap-2">
                <ScalarIconBuildings
                  class="text-c-2 size-3.5 shrink-0"
                  size="sm"
                  thickness="1.5" />
                <span class="truncate">{{
                  selectedNamespace?.label ?? 'Select a namespace'
                }}</span>
              </span>
              <ScalarIconCaretDown
                class="text-c-2 size-3.5 shrink-0"
                size="sm"
                thickness="1.5" />
            </ScalarButton>
          </ScalarListbox>
        </template>
        <template v-else>
          <div
            class="border-border bg-b-2 text-c-1 flex h-8 items-center gap-2 rounded border px-3 text-sm"
            :title="
              selectedNamespace
                ? `Publishing to ${selectedNamespace.label}`
                : undefined
            ">
            <ScalarIconBuildings
              class="text-c-2 size-3.5 shrink-0"
              size="sm"
              thickness="1.5" />
            <span class="truncate">
              {{ selectedNamespace?.label ?? '—' }}
            </span>
          </div>
        </template>
      </div>

      <!-- Slug input. Pre-filled with a slugified version of the document title. -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-c-1 text-xs font-medium"
          for="publish-document-slug">
          Slug
        </label>
        <input
          id="publish-document-slug"
          v-model="slug"
          autocomplete="off"
          class="border-border bg-b-1 text-c-1 placeholder:text-c-3 focus:border-c-accent h-8 rounded border px-3 text-sm outline-none"
          placeholder="pets-api"
          type="text" />
      </div>

      <!--
        Version input. The string lives on `info.version` after a
        successful publish so the local document and the registry stay
        in sync without an extra edit.
      -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-c-1 text-xs font-medium"
          for="publish-document-version">
          Version
        </label>
        <input
          id="publish-document-version"
          v-model="version"
          autocomplete="off"
          class="border-border bg-b-1 text-c-1 placeholder:text-c-3 focus:border-c-accent h-8 rounded border px-3 text-sm outline-none"
          placeholder="1.0.0"
          type="text" />
      </div>

      <!--
        Live preview of the published identity. Reading the modal
        top-down the user types a slug + version and sees the resulting
        coordinate update in place, which is more reassuring than
        decoding three separate fields. Hidden until enough fields
        resolve so we never render half a path.
      -->
      <div
        v-if="publishPreview"
        class="text-c-2 -mt-1 text-xs">
        Publishing as
        <span class="text-c-1 font-mono">{{ publishPreview }}</span>
      </div>

      <!--
        Inline error region. Stays mounted when present so the user can
        read the message while they are correcting the form rather than
        having it disappear after a toast timeout.
      -->
      <p
        v-if="errorMessage"
        class="text-red bg-b-2 rounded p-2 text-xs"
        role="alert">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end gap-2 pt-1">
        <ScalarButton
          size="sm"
          type="button"
          variant="ghost"
          @click="state.hide()">
          Cancel
        </ScalarButton>
        <ScalarButton
          :disabled="isSubmitDisabled"
          :loader="loader"
          size="sm"
          type="submit">
          Publish
        </ScalarButton>
      </div>
    </form>
  </ScalarModal>
</template>
