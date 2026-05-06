<script lang="ts">
/**
 * Confirmation modal for the destructive registry-delete affordances in
 * the document settings danger zone.
 *
 * Two flavours with different friction levels because the blast radius
 * is wildly different between them:
 *
 * - `mode === 'version'` removes a single version of a document.
 *   Recoverable in practice (republish the same semver) and only
 *   wipes one local copy, so we show the destructive summary and let
 *   the user confirm with the Delete button alone.
 * - `mode === 'document'` removes an entire document group (every
 *   version, every local copy). This one is gated behind a typed
 *   confirmation: the user must type `@namespace/slug` before the
 *   Delete button enables.
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
import {
  ScalarIconCheck,
  ScalarIconCheckCircle,
  ScalarIconCopy,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

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

const inputRef = useTemplateRef<HTMLInputElement>('confirmationInput')

const { copyToClipboard } = useClipboard()
/**
 * Tiny "Copied" affordance lifecycle. We do not pull in a full toast
 * here because the modal already owns the user's attention - swapping
 * the copy icon for a check for ~1.5s is enough acknowledgement.
 */
const justCopied = ref(false)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

const isVersionMode = computed(() => mode === 'version')
/**
 * Document-delete is the irreversible nuke (every version, every
 * local copy), so we keep the typed-confirmation gate there. Version
 * deletes are recoverable enough that the destructive summary plus a
 * single click is enough friction.
 */
const requiresTypedConfirmation = computed(() => !isVersionMode.value)

/**
 * The exact phrase the user must type to enable the Delete button
 * when `requiresTypedConfirmation` is on. Mirrors the registry
 * coordinate the parent will operate on so the confirmation reads as
 * "I know what I am about to remove" rather than a generic "type
 * DELETE" prompt.
 */
const expectedPhrase = computed<string>(() => {
  if (isVersionMode.value && version) {
    return `@${namespace}/${slug}@${version}`
  }
  return `@${namespace}/${slug}`
})

/**
 * Reset the form whenever the modal opens. Scoping the reset to the
 * `open` flag (and not to every prop change) preserves user input
 * across reactive updates while the modal is already on screen.
 *
 * When the typed-confirmation gate is active we also focus the input
 * on the next tick so keyboard users land directly on the field they
 * need to fill in. Version deletes skip the focus shuffle and let the
 * modal's default focus trap take over.
 */
watch(
  () => state.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    confirmation.value = ''
    errorMessage.value = null
    justCopied.value = false
    if (copiedTimeout) {
      clearTimeout(copiedTimeout)
      copiedTimeout = undefined
    }
    void loader.clear()
    if (requiresTypedConfirmation.value) {
      void nextTick(() => inputRef.value?.focus())
    }
  },
)

const trimmedConfirmation = computed(() => confirmation.value.trim())
const isMatch = computed(
  () => trimmedConfirmation.value === expectedPhrase.value,
)
/**
 * "Almost there" state: the user has started typing AND the prefix so
 * far matches the expected phrase character-for-character. Used to
 * decide whether to draw the input border in the accent colour
 * (in-progress) or the red error colour (definitely wrong).
 */
const isPrefixMatch = computed(
  () =>
    trimmedConfirmation.value.length > 0 &&
    expectedPhrase.value.startsWith(trimmedConfirmation.value),
)
const isMismatch = computed(
  () => trimmedConfirmation.value.length > 0 && !isPrefixMatch.value,
)
const isSubmitDisabled = computed(() => {
  if (loader.isLoading) {
    return true
  }
  if (requiresTypedConfirmation.value) {
    return !isMatch.value
  }
  return false
})

const introCopy = computed(() =>
  isVersionMode.value
    ? 'You are about to permanently remove this version from the registry. This cannot be undone.'
    : 'You are about to permanently remove this document and every version from the registry. This cannot be undone.',
)

/**
 * Bullet list rendered inside the consequences card. Splitting the
 * copy into discrete items (rather than a paragraph) makes the
 * destructive scope easy to scan: registry side first, then local
 * side, in the order the parent runs them.
 */
const consequences = computed<string[]>(() =>
  isVersionMode.value
    ? [
        'This version is removed from the registry for everyone.',
        'The local copy of this version is deleted from your workspace.',
      ]
    : [
        'Every version of this document is removed from the registry for everyone.',
        'Every local copy of this document is deleted from your workspace.',
      ],
)

const submitLabel = computed(() =>
  isVersionMode.value ? 'Delete version' : 'Delete document',
)

const handleCopyCoordinate = async (): Promise<void> => {
  await copyToClipboard(expectedPhrase.value)
  justCopied.value = true
  if (copiedTimeout) {
    clearTimeout(copiedTimeout)
  }
  copiedTimeout = setTimeout(() => {
    justCopied.value = false
    copiedTimeout = undefined
  }, 1500)
}

const handleSubmit = (): void => {
  errorMessage.value = null

  if (requiresTypedConfirmation.value && !isMatch.value) {
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
    variant="form">
    <form
      class="flex flex-col gap-5"
      @submit.prevent="handleSubmit">
      <!--
        Destructive intro. The icon + headline pair anchors the user's
        attention on the irreversible nature of the flow before they
        scan the rest of the card.
      -->
      <div class="flex items-start gap-3">
        <div
          aria-hidden="true"
          class="text-red flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--scalar-color-red),transparent_88%)]">
          <ScalarIconWarningOctagon
            class="size-5"
            weight="bold" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="text-c-1 text-sm font-semibold">
            This action cannot be undone
          </p>
          <p class="text-c-2 text-sm leading-normal text-pretty">
            {{ introCopy }}
          </p>
        </div>
      </div>

      <!--
        Consequences card. Renders the registry coordinate as a mono
        code badge with a copy button (so users do not have to
        hand-retype it into the confirmation field, or into a chat
        with a teammate after the fact) and lists the destructive
        scope as bullets so each consequence stays scannable.
      -->
      <div
        class="border-border bg-b-2 flex flex-col gap-3 rounded-lg border p-3">
        <div class="flex flex-col gap-1">
          <span class="text-c-3 text-xs font-medium tracking-wide uppercase">
            {{ isVersionMode ? 'Version' : 'Document' }}
          </span>
          <div
            class="bg-b-1 border-border flex items-center gap-2 rounded border p-1.5 pl-2">
            <code class="text-c-1 min-w-0 flex-1 font-mono text-xs break-all">
              {{ expectedPhrase }}
            </code>
            <button
              :aria-label="
                justCopied
                  ? 'Copied to clipboard'
                  : 'Copy coordinate to clipboard'
              "
              class="text-c-2 hover:text-c-1 hover:bg-b-3 flex size-6 shrink-0 items-center justify-center rounded transition-colors"
              type="button"
              @click="handleCopyCoordinate">
              <ScalarIconCheck
                v-if="justCopied"
                aria-hidden="true"
                class="text-green size-3.5" />
              <ScalarIconCopy
                v-else
                aria-hidden="true"
                class="size-3.5" />
            </button>
          </div>
        </div>
        <ul class="text-c-2 flex flex-col gap-1.5 text-xs">
          <li
            v-for="item in consequences"
            :key="item"
            class="flex items-start gap-2">
            <span
              aria-hidden="true"
              class="bg-border mt-1.5 size-1 shrink-0 rounded-full" />
            <span class="leading-normal">{{ item }}</span>
          </li>
        </ul>
      </div>

      <!--
        Typed-confirmation gate. Only rendered for the
        whole-document delete because that flow wipes every version
        and every local copy at once. Single-version deletes skip
        this section so the user is not forced to retype a
        coordinate just to remove one recoverable version.

        The live border colour gives instant feedback: accent while
        typing the right prefix, red the moment the typed value
        diverges from the expected phrase, and a success check once
        the full phrase matches.
      -->
      <div
        v-if="requiresTypedConfirmation"
        class="flex flex-col gap-1.5">
        <label
          class="text-c-1 text-xs font-medium"
          for="delete-registry-confirmation">
          To confirm, type the document coordinate above
        </label>
        <div class="relative">
          <input
            id="delete-registry-confirmation"
            ref="confirmationInput"
            v-model="confirmation"
            aria-describedby="delete-registry-confirmation-feedback"
            :aria-invalid="isMismatch"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            class="bg-b-1 text-c-1 placeholder:text-c-3 h-9 w-full rounded border px-3 pr-9 font-mono text-sm transition-colors outline-none"
            :class="{
              'border-border focus:border-c-accent': !isMismatch && !isMatch,
              'border-red focus:border-red': isMismatch,
              'border-green focus:border-green': isMatch,
            }"
            :placeholder="expectedPhrase"
            spellcheck="false"
            type="text" />
          <ScalarIconCheckCircle
            v-if="isMatch"
            aria-hidden="true"
            class="text-green pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
            weight="fill" />
        </div>
        <p
          id="delete-registry-confirmation-feedback"
          class="min-h-[1rem] text-xs leading-tight"
          :class="{
            'text-c-3': !isMismatch && !isMatch,
            'text-red': isMismatch,
            'text-green': isMatch,
          }">
          <template v-if="isMatch">
            Coordinate matches. Ready to delete.
          </template>
          <template v-else-if="isMismatch">
            Does not match
            <span class="font-mono">{{ expectedPhrase }}</span>
            yet.
          </template>
          <template v-else>
            The Delete button stays disabled until the coordinate matches.
          </template>
        </p>
      </div>

      <!--
        Inline error region. Stays mounted when present so the user
        can read the message while they correct the form rather than
        having it disappear after a toast timeout. We use the same
        warning icon as the headline to tie the failure visually back
        to the destructive context.
      -->
      <div
        v-if="errorMessage"
        class="text-red border-red/30 flex items-start gap-2 rounded border bg-[color-mix(in_srgb,var(--scalar-color-red),transparent_92%)] p-2.5 text-xs"
        role="alert">
        <ScalarIconWarningOctagon
          aria-hidden="true"
          class="mt-0.5 size-3.5 shrink-0" />
        <span class="leading-normal">{{ errorMessage }}</span>
      </div>

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
          {{ submitLabel }}
        </ScalarButton>
      </div>
    </form>
  </ScalarModal>
</template>
