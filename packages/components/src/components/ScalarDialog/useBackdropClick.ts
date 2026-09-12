import type { Ref } from 'vue'

/** The pointer coordinates we compare against the dialog's box. */
type PointerPosition = Pick<MouseEvent, 'clientX' | 'clientY'>

/** A rectangle we can test a pointer position against (a subset of `DOMRect`). */
type Box = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>

/**
 * Whether a pointer position falls outside a box.
 *
 * A native `<dialog>` renders its `::backdrop` as part of the dialog element, so a
 * click on the backdrop targets the dialog itself. That is why `onClickOutside` (and
 * any "is the event target inside my element" check) cannot detect a backdrop click —
 * the target is the dialog. Comparing the pointer position against the dialog's box is
 * the reliable way to tell a backdrop click from a click on the dialog surface. The box
 * comes from `getBoundingClientRect()`, so it already includes padding and border: a
 * click in the dialog's padding counts as inside and keeps the dialog open.
 */
export const isPointerOutsideBox = (
  { clientX, clientY }: PointerPosition,
  { top, right, bottom, left }: Box,
): boolean => clientX < left || clientX > right || clientY < top || clientY > bottom

/**
 * Dismiss a native `<dialog>` when the backdrop is clicked.
 *
 * Returns `pointerdown` and `click` handlers to bind on the `<dialog>`. A click only
 * counts as a backdrop dismissal when the pointer was both pressed and released on the
 * backdrop, which avoids two failure modes a naive click-position check has:
 *
 * - **Text-selection drags** — pressing inside the dialog, dragging to select text, and
 *   releasing outside would otherwise fire a `click` with outside coordinates and close
 *   the dialog. Requiring the press to also be outside keeps it open.
 * - **Keyboard-activated controls** — pressing Enter or Space on a focused button
 *   dispatches a synthetic `click` with `detail === 0` and coordinates of `(0, 0)`, which
 *   sit outside the centered dialog. Ignoring `detail === 0` clicks keeps the dialog open
 *   when a control inside it is used from the keyboard.
 *
 * @param dialogRef - Template ref to the native `<dialog>` element.
 * @param onDismiss - Called when a genuine backdrop click is detected.
 */
export const useBackdropClick = (
  dialogRef: Ref<HTMLDialogElement | null>,
  onDismiss: () => void,
): {
  handlePointerDown: (event: PointerEvent) => void
  handleClick: (event: MouseEvent) => void
} => {
  /** Whether the most recent primary press landed on the backdrop. */
  let pressedOnBackdrop = false

  const handlePointerDown = (event: PointerEvent): void => {
    const element = dialogRef.value
    // Only the primary (left) button can lead to a `click`, so ignore the rest.
    pressedOnBackdrop = event.button === 0 && !!element && isPointerOutsideBox(event, element.getBoundingClientRect())
  }

  const handleClick = (event: MouseEvent): void => {
    const element = dialogRef.value
    const pressed = pressedOnBackdrop
    // Reset for the next interaction before any early return.
    pressedOnBackdrop = false

    // Ignore keyboard-synthesized clicks: they report `detail === 0` and `(0, 0)`.
    if (!element || event.detail === 0) {
      return
    }

    if (pressed && isPointerOutsideBox(event, element.getBoundingClientRect())) {
      onDismiss()
    }
  }

  return { handlePointerDown, handleClick }
}
