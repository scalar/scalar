import { useEffect } from 'react'

/* Windows stack in the order they were last touched. */
let topWindowLayer = 12

export const raiseWindow = (node) => {
  if (node) {
    topWindowLayer += 1
    node.style.zIndex = String(topWindowLayer)
  }
}

/** Put a window back where the layout wants it. */
export const resetPosition = (node) => {
  if (!node) {
    return
  }
  node.style.transform = ''
  node.style.zIndex = ''
  delete node.dataset.moved
}

/* Keep at least this much of the window reachable on every edge. */
const MARGIN = 48

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * Make the node in `nodeRef` draggable by the handle in `handleRef`, the way a
 * window moves by its title bar.
 *
 * Position is applied as a transform so the element keeps its place in the
 * layout, and the offset is clamped to the viewport so a window can never be
 * thrown somewhere the reader cannot grab it again.
 */
export const useDraggable = (nodeRef, handleRef) => {
  useEffect(() => {
    const node = nodeRef.current
    const handle = handleRef.current

    if (!node || !handle) {
      return undefined
    }

    let dragging = false
    let startX = 0
    let startY = 0
    let originX = 0
    let originY = 0
    let offsetX = 0
    let offsetY = 0

    /* Where the window sits with no transform applied, plus its size. Measured
     * only when the live transform matches offsetX/offsetY — reading it during
     * a drag would subtract the new offset from a rect that still carries the
     * previous one, and the clamp would let the window slide off screen. */
    let baseLeft = 0
    let baseTop = 0
    let width = 0
    let height = 0

    const measure = () => {
      const rect = node.getBoundingClientRect()
      baseLeft = rect.left - offsetX
      baseTop = rect.top - offsetY
      width = rect.width
      height = rect.height
    }

    const apply = () => {
      offsetX = clamp(offsetX, MARGIN - baseLeft - width, window.innerWidth - baseLeft - MARGIN)
      offsetY = clamp(offsetY, MARGIN - baseTop - height, window.innerHeight - baseTop - MARGIN)

      node.style.transform = `translate(${Math.round(offsetX)}px, ${Math.round(offsetY)}px)`
      node.dataset.moved = 'true'
    }

    const onPointerDown = (event) => {
      /* Buttons and links inside the bar keep their own behaviour. */
      if (event.button !== 0 || event.target.closest('button, a, input')) {
        return
      }

      raiseWindow(node)
      measure()

      dragging = true
      startX = event.clientX
      startY = event.clientY
      originX = offsetX
      originY = offsetY

      handle.setPointerCapture(event.pointerId)
      handle.dataset.dragging = 'true'
      event.preventDefault()
    }

    const onPointerMove = (event) => {
      if (!dragging) {
        return
      }
      offsetX = originX + (event.clientX - startX)
      offsetY = originY + (event.clientY - startY)
      apply()
    }

    const end = (event) => {
      if (!dragging) {
        return
      }
      dragging = false
      delete handle.dataset.dragging
      if (handle.hasPointerCapture?.(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId)
      }
    }

    /* A resize can strand a window off screen, so re-clamp what is already moved. */
    const onResize = () => {
      if (node.dataset.moved === 'true') {
        measure()
        apply()
      }
    }

    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
    window.addEventListener('resize', onResize)

    return () => {
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      window.removeEventListener('resize', onResize)
    }
  }, [nodeRef, handleRef])
}
