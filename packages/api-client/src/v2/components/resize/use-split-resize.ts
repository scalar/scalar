import type { Ref } from 'vue'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

type UseSplitResizeOptions = {
  /** Ref to the container used for horizontal resize (width + clientX). */
  horizontalContainerRef: Ref<HTMLElement | undefined>
  /** Ref to the container used for vertical resize (height + clientY). */
  verticalContainerRef: Ref<HTMLElement | undefined>
  /** Ref for the left (or first) pane width in percent (0–100). */
  leftPaneSize: Ref<number>
  /** Ref for the top pane height in percent (0–100). */
  topPaneSize: Ref<number>
  horizontalMin?: number
  horizontalMax?: number
  verticalMin?: number
  verticalMax?: number
}

/**
 * Shared pointer-based resize logic for split layouts with percentage sizes.
 * Use when you have both a horizontal split (e.g. left/right) and a vertical split (e.g. top/bottom).
 * Only one resize is active at a time; starting another stops the previous.
 */
export function useSplitResize(options: UseSplitResizeOptions): {
  onHorizontalResizeStart: (event: PointerEvent) => void
  onVerticalResizeStart: (event: PointerEvent) => void
  stopActiveResize: () => void
} {
  const {
    horizontalContainerRef,
    verticalContainerRef,
    leftPaneSize,
    topPaneSize,
    horizontalMin = 20,
    horizontalMax = 80,
    verticalMin = 25,
    verticalMax = 75,
  } = options

  let activeResizeCleanup: (() => void) | undefined

  const stopActiveResize = (): void => {
    activeResizeCleanup?.()
    activeResizeCleanup = undefined
  }

  const startResize = (event: PointerEvent, onMove: (event: PointerEvent) => void, cursor: string): void => {
    event.preventDefault()
    stopActiveResize()

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = cursor

    const handleMove = (moveEvent: PointerEvent): void => {
      onMove(moveEvent)
    }

    const handleUp = (): void => {
      stopActiveResize()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp, { once: true })

    activeResizeCleanup = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
    }
  }

  const onHorizontalResizeStart = (event: PointerEvent): void => {
    const el = horizontalContainerRef.value
    if (!el) {
      return
    }
    startResize(
      event,
      (moveEvent) => {
        const rect = el.getBoundingClientRect()
        const ratio = ((moveEvent.clientX - rect.left) / rect.width) * 100
        leftPaneSize.value = clamp(ratio, horizontalMin, horizontalMax)
      },
      'col-resize',
    )
  }

  const onVerticalResizeStart = (event: PointerEvent): void => {
    const el = verticalContainerRef.value
    if (!el) {
      return
    }
    startResize(
      event,
      (moveEvent) => {
        const rect = el.getBoundingClientRect()
        const ratio = ((moveEvent.clientY - rect.top) / rect.height) * 100
        topPaneSize.value = clamp(ratio, verticalMin, verticalMax)
      },
      'row-resize',
    )
  }

  return {
    onHorizontalResizeStart,
    onVerticalResizeStart,
    stopActiveResize,
  }
}
