import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { isPointerOutsideBox, useBackdropClick } from './useBackdropClick'

/** A dialog box centered away from the origin, matching a real centered dialog. */
const BOX = { top: 100, right: 300, bottom: 300, left: 100 }

/** Build a fake dialog element whose `getBoundingClientRect` returns {@link BOX}. */
const dialogWith = (box = BOX) =>
  ref({ getBoundingClientRect: () => box }) as unknown as Parameters<typeof useBackdropClick>[0]

/** Build a pointer event with sensible defaults for the fields the composable reads. */
const pointer = (overrides: Partial<PointerEvent> = {}) =>
  ({ button: 0, clientX: 0, clientY: 0, ...overrides }) as PointerEvent

/** Build a click event; a real mouse click reports `detail >= 1`. */
const click = (overrides: Partial<MouseEvent> = {}) =>
  ({ detail: 1, clientX: 0, clientY: 0, ...overrides }) as MouseEvent

describe('isPointerOutsideBox', () => {
  it('is false for a point inside the box', () => {
    expect(isPointerOutsideBox({ clientX: 200, clientY: 200 }, BOX)).toBe(false)
  })

  it('is false on the edges (padding counts as inside)', () => {
    expect(isPointerOutsideBox({ clientX: 100, clientY: 100 }, BOX)).toBe(false)
    expect(isPointerOutsideBox({ clientX: 300, clientY: 300 }, BOX)).toBe(false)
  })

  it('is true to the left, right, above, and below', () => {
    expect(isPointerOutsideBox({ clientX: 99, clientY: 200 }, BOX)).toBe(true)
    expect(isPointerOutsideBox({ clientX: 301, clientY: 200 }, BOX)).toBe(true)
    expect(isPointerOutsideBox({ clientX: 200, clientY: 99 }, BOX)).toBe(true)
    expect(isPointerOutsideBox({ clientX: 200, clientY: 301 }, BOX)).toBe(true)
  })

  it('treats the origin as outside a centered box', () => {
    expect(isPointerOutsideBox({ clientX: 0, clientY: 0 }, BOX)).toBe(true)
  })
})

describe('useBackdropClick', () => {
  it('dismisses when the pointer is pressed and released on the backdrop', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    handlePointerDown(pointer({ clientX: 10, clientY: 10 }))
    handleClick(click({ clientX: 10, clientY: 10 }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('does not dismiss for a click inside the dialog', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    handlePointerDown(pointer({ clientX: 200, clientY: 200 }))
    handleClick(click({ clientX: 200, clientY: 200 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('does not dismiss a text-selection drag that starts inside and ends outside', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    // Press on the content, then release out on the backdrop.
    handlePointerDown(pointer({ clientX: 200, clientY: 200 }))
    handleClick(click({ clientX: 10, clientY: 10 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('does not dismiss when a press on the backdrop is released inside the dialog', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    handlePointerDown(pointer({ clientX: 10, clientY: 10 }))
    handleClick(click({ clientX: 200, clientY: 200 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('ignores keyboard-synthesized clicks (detail 0 at the origin)', () => {
    const onDismiss = vi.fn()
    const { handleClick } = useBackdropClick(dialogWith(), onDismiss)

    // Activating a button with Enter/Space dispatches a click with no prior pointerdown.
    handleClick(click({ detail: 0, clientX: 0, clientY: 0 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('ignores non-primary button presses', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    handlePointerDown(pointer({ button: 2, clientX: 10, clientY: 10 }))
    handleClick(click({ clientX: 10, clientY: 10 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('resets between interactions so a stale backdrop press cannot leak into a later click', () => {
    const onDismiss = vi.fn()
    const { handlePointerDown, handleClick } = useBackdropClick(dialogWith(), onDismiss)

    // A backdrop press that never produced a matching outside click (released inside).
    handlePointerDown(pointer({ clientX: 10, clientY: 10 }))
    handleClick(click({ clientX: 200, clientY: 200 }))
    expect(onDismiss).not.toHaveBeenCalled()

    // A later inside click must not inherit the earlier backdrop press.
    handleClick(click({ clientX: 200, clientY: 200 }))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('does nothing when the dialog ref is not set', () => {
    const onDismiss = vi.fn()
    const dialogRef = ref(null)
    const { handlePointerDown, handleClick } = useBackdropClick(dialogRef, onDismiss)

    handlePointerDown(pointer({ clientX: 10, clientY: 10 }))
    handleClick(click({ clientX: 10, clientY: 10 }))

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
