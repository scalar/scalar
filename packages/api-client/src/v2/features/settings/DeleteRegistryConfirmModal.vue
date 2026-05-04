<script lang="ts">
/**
 * Confirmation modal for the destructive registry-delete affordances in
 * the document settings danger zone.
 *
 * Two flavours, both gated behind the same typed-confirmation pattern
 * so a stray click cannot wipe a registry document by accident:
 *
 * - `mode === 'version'` removes a single version of a document. The
 *   user must type `namespace/slug@version` to enable the Delete
 *   button.
 * - `mode === 'document'` removes an entire document group (every
 *   version). The user must type `namespace/slug` instead.
 *
 * The component is purely presentational. The parent owns the actual
 * adapter calls and resolves `submit` with `{ ok: true }` to close the
 * modal or `{ ok: false, message }` to surface an inline error so the
 * user can read the failure without losing the typed confirmation.
 */
export default {}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarModal,
  useLoadingState,
  type ModalState,
} from '@scalar/components'
import { computed, ref, watch } from 'vue'

const { state, mode, namespace, slug, version } = defineProps<{
  /** Modal control returned by `useModal()`. */
  state: ModalState
  /** Which destructive flow we are confirming. */
  mode: 'version' | 'document'
  /** Registry namespace the document lives under. */
  namespace: string
  /** Registry slug for the document group. */
  slug: string
  /**
   * Version identifier when `mode === 'version'`. Required for
   * version-deletes, ignored otherwise. Typed as optional so the
   * caller can pass `undefined` when opening the document-delete
   * modal without having to gate the prop separately.
   */
  version?: string
}>()

const emit = defineEmits<{
  /**
   * Fired once the user has typed the confirmation phrase and pressed
   * Delete. The parent must resolve the returned promise with either
   * `{ ok: true }` (modal closes) or `{ ok: false, message }` (message
   * is rendered inline so the user can retry without losing what they
   * typed).
   */
  (
    event: 'submit',
    payload: {
      done: (outcome: { ok: true } | { ok: false; message: string }) => void
    },
  ): void
}>()

const confirmation = ref('')
const errorMessage = ref<string | null>(null)
const loader = useLoadingState()

/**
 * The exact phrase the user must type to enable the Delete button.
 * Mirrors the registry coordinate the parent will operate on so the
 * confirmation reads as "I know what I am about to remove" rather than
 * a generic "type DELETE" prompt.
 */
const expectedPhrase = computed<string>(() => {
  if (mode === 'version' && version) {
    return `${namespace}/${slug}@${version}`
  }
  return `${namespace}/${slug}`
})

/**
 * Reset the form whenever the modal opens. Scoping the reset to the
 * `open` flag (and not to every prop change) preserves user input
 * across reactive updates while the modal is already on screen.
 */
watch(
  () => state.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    confirmation.value = ''
    errorMessage.value = null
    void loader.clear()
  },
)

const isMatch = computed(
  () => confirmation.value.trim() === expectedPhrase.value,
)
const isSubmitDisabled = computed(() => !isMatch.value || loader.isLoading)

const title = computed(() =>
  mode === 'version'
    ? 'Delete this version from the registry'
    : 'Delete document from registry',
)

const description = computed(() =>
  mode === 'version'
    ? 'Removes this version from the registry and deletes the local copy. This action cannot be undone.'
    : 'Removes every version of this document from the registry and deletes every local copy. This action cannot be undone.',
)

const handleSubmit = (): void => {
  errorMessage.value = null

  if (!isMatch.value) {
    return
  }

  loader.start()

  emit('submit', {
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
    :title="title"
    variant="form">
    <form
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit">
      <p class="text-c-2 text-sm leading-normal text-pretty">
        {{ description }}
      </p>

      <div class="flex flex-col gap-1.5">
        <label
          class="text-c-1 text-xs font-medium"
          for="delete-registry-confirmation">
          Type
          <span class="text-c-1 font-mono">{{ expectedPhrase }}</span>
          to confirm
        </label>
        <input
          id="delete-registry-confirmation"
          v-model="confirmation"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          class="border-border bg-b-1 text-c-1 placeholder:text-c-3 focus:border-c-accent h-8 rounded border px-3 text-sm outline-none"
          :placeholder="expectedPhrase"
          spellcheck="false"
          type="text" />
      </div>

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
          type="submit"
          variant="danger">
          Delete
        </ScalarButton>
      </div>
    </form>
  </ScalarModal>
</template>
