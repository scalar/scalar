<script lang="ts">
/**
 * Scalar Dialog
 *
 * A modal dialog built on the native `<dialog>` element. It calls `showModal()`
 * under the hood, so the dialog is promoted to the browser top layer (escaping
 * ancestor stacking, overflow, and transform contexts), traps and restores focus,
 * makes the rest of the page inert, and closes on Escape — all natively, with no
 * teleport. It also locks page scrolling while open, and gives popovers inside it a
 * teleport target within the dialog so they render above it rather than under the
 * top layer.
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

import { ScalarTeleportRoot } from '../ScalarTeleport'
import type { ScalarDialogProps } from './types'
import { useBackdropClick } from './useBackdropClick'
import { useScrollLock } from './useScrollLock'

const { persist = false } = defineProps<ScalarDialogProps>()

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

const { lock, unlock } = useScrollLock()

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

  if (open.value) {
    if (!element.open) {
      element.showModal()
    }
    lock(element)
  } else {
    if (element.open) {
      element.close()
    }
    unlock()
  }
})

/**
 * Mirror native closes (a form submit, or the browser force-closing the dialog) back into the model.
 *
 * The `close` event is queued rather than fired synchronously, so when the dialog is closed and
 * reopened in quick succession the event lands after it is open again. Ignoring it while the
 * dialog is open keeps that stale event from closing it.
 */
const handleClose = (): void => {
  if (dialogRef.value?.open) {
    return
  }
  open.value = false
  emit('close')
}

/**
 * Close on Escape, unless something inside the dialog already handled it.
 *
 * Child widgets such as listboxes and comboboxes use Escape to close themselves and mark the event
 * as handled, so the dialog leaves those alone. Stopping propagation means only the innermost of
 * several nested dialogs closes. Preventing the default also stops a search input from clearing
 * its value on the same keypress that dismisses the dialog.
 */
const handleEscape = (event: KeyboardEvent): void => {
  if (event.defaultPrevented) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  open.value = false
}

/**
 * Route other close requests, such as the Android back gesture, through the model.
 *
 * The browser would otherwise close the dialog itself. Going through `open` keeps every close on
 * the same path, so the scroll lock is released and the contents unmount in step.
 */
const handleCancel = (event: Event): void => {
  event.preventDefault()
  open.value = false
}

/**
 * Close when the backdrop is clicked. The composable ignores text-selection drags
 * and keyboard-activated controls; setting `open` to false lets the puppet bridge
 * run the native `close()` so the flow matches Escape and programmatic closes.
 */
const { handlePointerDown, handleClick } = useBackdropClick(dialogRef, () => {
  open.value = false
})
</script>

<template>
  <dialog
    ref="dialogRef"
    v-bind="cx(dialog())"
    @cancel="handleCancel"
    @click="handleClick"
    @close="handleClose"
    @keydown.esc="handleEscape"
    @pointerdown="handlePointerDown">
    <ScalarTeleportRoot v-if="persist || open">
      <slot />
    </ScalarTeleportRoot>
  </dialog>
</template>
