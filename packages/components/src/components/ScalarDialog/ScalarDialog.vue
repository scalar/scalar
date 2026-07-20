<script lang="ts">
/**
 * Scalar Dialog
 *
 * A modal dialog built on the native `<dialog>` element. It calls `showModal()`
 * under the hood, so the dialog is promoted to the browser top layer (escaping
 * ancestor stacking, overflow, and transform contexts), traps and restores focus,
 * makes the rest of the page inert, and closes on Escape — all natively, with no
 * teleport and no extra wrapper elements.
 *
 * Control it with `v-model:open` and compose the contents with the default slot.
 * Restyle or resize it by passing your own `class`; the defaults are intentionally
 * minimal so consumers compose rather than configure.
 *
 * @example
 * <ScalarDialog v-model:open="open">
 *   <h2>Title</h2>
 *   <p>Some content</p>
 * </ScalarDialog>
 */
export default {}
</script>

<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref, watchPostEffect } from 'vue'

import type { ScalarDialogProps } from './types'
import { useBackdropClick } from './useBackdropClick'

const { unmount = true, closeOnBackdrop = true } =
  defineProps<ScalarDialogProps>()

const emit = defineEmits<{
  /** Emitted whenever the dialog closes, whether via Escape, a backdrop click, or `open` being set to false. */
  (e: 'close'): void
}>()

defineSlots<{
  /** The dialog contents. Compose your own header, body, and footer here. */
  default(): unknown
}>()

/** Whether the dialog is open. Drives the native `showModal()` and `close()` calls. */
const open = defineModel<boolean>('open', { default: false })

const dialog = cva({
  base: [
    // Reset the native dialog chrome and center it within the top layer
    'scalar-dialog m-auto rounded-lg border-0 p-3 shadow-lg',
    // Surface colors
    'bg-b-1 text-c-1',
    // Theme the native ::backdrop via Tailwind's backdrop variant
    'backdrop:bg-backdrop dark:backdrop:bg-backdrop-dark',
    // Constrain the size and let long content scroll
    'custom-scroll max-h-[85svh] w-[calc(100dvw-2rem)] max-w-md overflow-auto',
  ],
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const dialogRef = ref<HTMLDialogElement | null>(null)

/**
 * Puppet the native dialog from the reactive `open` model.
 *
 * `watchPostEffect` runs after the DOM updates, so the slotted content (and any
 * `autofocus` target) is mounted before `showModal()` moves focus into it. The
 * guards against `dialog.open` avoid the `InvalidStateError` the browser throws
 * when `showModal()` is called on an already-open dialog.
 */
watchPostEffect(() => {
  const element = dialogRef.value
  if (!element) {
    return
  }

  if (open.value && !element.open) {
    element.showModal()
  } else if (!open.value && element.open) {
    element.close()
  }
})

/** Mirror native closes (Escape, form submit, programmatic) back into the model. */
const handleClose = () => {
  open.value = false
  emit('close')
}

/**
 * Close when the backdrop is clicked. The composable ignores text-selection drags
 * and keyboard-activated controls; setting `open` to false lets the puppet bridge
 * run the native `close()` so the flow matches Escape and programmatic closes.
 */
const { handlePointerDown, handleClick } = useBackdropClick(dialogRef, () => {
  if (closeOnBackdrop) {
    open.value = false
  }
})
</script>

<template>
  <dialog
    ref="dialogRef"
    v-bind="cx(dialog())"
    @close="handleClose"
    @pointerdown="handlePointerDown"
    @click="handleClick">
    <template v-if="!unmount || open">
      <slot />
    </template>
  </dialog>
</template>
