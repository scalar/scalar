import { type MaybeRefOrGetter, type Ref, getCurrentInstance, onMounted, onScopeDispose, ref, toValue } from 'vue'

/**
 * Pointer-drag resizing for a docked pane, ported from the docs editor's
 * shared pane hook (collapse support trimmed — the agent panel closes through
 * its own button instead of a drag-under-threshold latch). Each pane measures
 * its size as the distance from an anchored edge to the pointer, so one hook
 * covers both axes and both anchoring directions.
 *
 * The mechanics beyond the drag itself:
 * - pointer capture with a window-level release backstop, because the content
 *   below can steal the gesture and swallow the handle's own `pointerup`
 * - a document-wide selection lock, so the sweep cannot start selecting text
 * - persistence with clamp-on-read, so a size stored on a wide monitor cannot
 *   crush the layout on a laptop
 * - keyboard resizing with ARIA value upkeep for handles that opt in
 */

/** How far the arrow keys move a pane per press. */
const KEYBOARD_STEP = 16

/** The larger step for Page Up / Page Down. */
const KEYBOARD_PAGE_STEP = 64

/**
 * Clamp a size into its allowed range.
 *
 * The range can invert: a viewport narrow enough that the minimum pane size
 * and the neighbour's floor do not both fit leaves `max` below `min`. Returning
 * the minimum there keeps the pane usable instead of handing back a negative
 * size that would collapse the layout track.
 */
export function clampPaneSize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  if (max < min) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

/**
 * Read a persisted size, falling back whenever the stored value cannot be
 * trusted. Clamping on read matters as much as clamping on write: a size stored
 * on a wide monitor would otherwise crush the layout when the same page is
 * opened on a laptop. The fallback is clamped for the same reason.
 */
export function readStoredPaneSize(key: string, fallback: number, min: number, max: number): number {
  if (typeof window === 'undefined') {
    return clampPaneSize(fallback, min, max)
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return clampPaneSize(fallback, min, max)
    }

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      return clampPaneSize(fallback, min, max)
    }

    return clampPaneSize(parsed, min, max)
  } catch {
    // Reading storage throws in Safari's private mode, where the pane should
    // still open at its default rather than take the page down.
    return clampPaneSize(fallback, min, max)
  }
}

/** Persist a size, ignoring storage failures for the same reason as above. */
export function persistPaneSize(key: string, value: number): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, String(Math.round(value)))
  } catch {
    // Nothing to do — the pane keeps working, it just will not be remembered.
  }
}

export type ResizablePaneOptions = {
  /** `x` resizes a width, `y` a height. Defaults to `x`. */
  axis?: 'x' | 'y'
  /**
   * Which edge the pane hugs. A `start` pane (docked left or top) grows as the
   * pointer moves away from the measured edge; an `end` pane (docked right or
   * bottom) measures its size back from that edge toward the pointer.
   */
  anchor: 'start' | 'end'
  /** Smallest size the pane may settle at. */
  min: number
  /** Largest size, re-read on every pointer move so it can track the viewport. */
  max: MaybeRefOrGetter<number>
  /** Size used before anything is stored, and the target of `reset`. */
  defaultSize: number
  /** localStorage key holding the committed size. */
  storageKey: string
  /**
   * The edge the drag measures from, in client coordinates — the near (left or
   * top) edge for `start` panes, the far (right or bottom) edge for `end`
   * panes. Snapshotted once per drag, so it stays correct even as the pane
   * resizes underneath the pointer. `start` panes may omit it to measure from
   * the viewport origin; `end` panes must provide it.
   */
  measureEdge?: () => number | undefined
  /**
   * Write the live size during the drag. Hosts write it imperatively (a direct
   * `style.setProperty`) so a per-frame value never re-patches a reactive style
   * binding.
   */
  apply?: (size: number) => void
}

type ResizablePane = {
  /** The committed size. Bind reactive styles to this, not the live drag. */
  size: Ref<number>
  /** The lower bound, for `aria-valuemin`. */
  minSize: number
  /**
   * The most recently measured upper bound, floored at `minSize`, for
   * `aria-valuemax`. Refreshed whenever the hook measures the range.
   */
  maxSize: Ref<number>
  /** True for the duration of a drag; hosts use it to suspend transitions. */
  isResizing: Ref<boolean>
  start: (event: PointerEvent) => void
  track: (event: PointerEvent) => void
  end: () => void
  /** Abandon a drag without committing (pointercancel, unmount). */
  cancel: () => void
  /** Restore the default size — the double-click escape hatch. */
  reset: () => void
  /**
   * Re-read the persisted size against the live bounds. Runs automatically on
   * mount (a `max` derived from a template ref measures as garbage during
   * setup) and again when the window resizes, so a committed size can never
   * outgrow a shrunk viewport. Exposed for hosts whose bounds move for other
   * reasons.
   */
  remeasure: () => void
  onKeydown: (event: KeyboardEvent) => void
}

export function useResizablePane(options: ResizablePaneOptions): ResizablePane {
  const { anchor, min, defaultSize, storageKey, measureEdge, apply } = options

  const axis = options.axis ?? 'x'

  /** The published bound; see `ResizablePane['maxSize']`. */
  const maxSize = ref(min)

  const resolveMax = (): number => {
    const value = toValue(options.max)
    maxSize.value = Math.max(min, value)
    return value
  }

  const size = ref(readStoredPaneSize(storageKey, defaultSize, min, resolveMax()))
  const isResizing = ref(false)

  /** Live size for the current drag; only copied into `size` on release. */
  let dragSize = size.value
  /** The measured edge, snapshotted at pointerdown. */
  let dragEdge = 0
  /** Kept so an interrupted drag can release its capture. */
  let dragTarget: HTMLElement | null = null
  let dragPointerId: number | null = null
  /**
   * The handle from the most recent drag. `aria-valuenow` is written to it
   * imperatively per move — binding a live value reactively would re-render
   * the whole host layout on every pointer event, which the imperative `apply`
   * design exists to avoid. Templates bind the committed `size`, which the
   * settle re-renders back into agreement.
   */
  let handleEl: HTMLElement | null = null

  function releaseCapture() {
    if (dragTarget && dragPointerId !== null) {
      try {
        dragTarget.releasePointerCapture(dragPointerId)
      } catch {
        // The pointer is already gone; nothing left to release.
      }
    }
    dragTarget = null
    dragPointerId = null

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', cancel)
    }
    setDocumentDragging(false)
  }

  function applySize(next: number) {
    handleEl?.setAttribute('aria-valuenow', String(Math.round(next)))
    apply?.(next)
  }

  /**
   * Suppress selection for the whole document while dragging. Without it the
   * pointer sweeping across the page starts selecting its text, and the
   * browser then hands the gesture to that selection — which is how a drag
   * ends without the handle ever seeing its `pointerup`.
   */
  function setDocumentDragging(dragging: boolean) {
    if (typeof document === 'undefined') {
      return
    }
    document.body.style.userSelect = dragging ? 'none' : ''
    document.body.style.cursor = dragging ? (axis === 'x' ? 'col-resize' : 'row-resize') : ''
  }

  function resolveEdge(): number | undefined {
    if (measureEdge) {
      return measureEdge()
    }
    // A start pane with no explicit edge measures from the viewport origin;
    // an end pane has nothing sane to fall back to.
    return anchor === 'start' ? 0 : undefined
  }

  function start(event: PointerEvent) {
    // Any button starts a drag otherwise, and a right-click never sends the
    // matching pointerup — which would leave the pane stuck in resize mode.
    if (event.button !== 0) {
      return
    }

    const edge = resolveEdge()
    if (edge === undefined) {
      return
    }

    dragEdge = edge
    dragSize = size.value
    isResizing.value = true

    dragTarget = event.currentTarget as HTMLElement | null
    handleEl = dragTarget
    dragPointerId = event.pointerId
    dragTarget?.setPointerCapture(event.pointerId)
    setDocumentDragging(true)

    // A backstop for the release: pointer capture can be lost mid-gesture (the
    // content below claiming the pointer, a drag leaving the window), and then
    // the handle never receives its own `pointerup`. Without this the pane
    // stays in resize mode and every later hover resizes it.
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', cancel)
    }

    event.preventDefault()
  }

  function track(event: PointerEvent) {
    if (!isResizing.value) {
      return
    }

    // No button held means the release was missed. Settle at the last dragged
    // size rather than treating a plain hover as a drag.
    if (event.buttons === 0) {
      end()
      return
    }

    const pointer = axis === 'x' ? event.clientX : event.clientY
    const distance = anchor === 'end' ? dragEdge - pointer : pointer - dragEdge

    dragSize = clampPaneSize(distance, min, resolveMax())
    applySize(dragSize)
  }

  function end() {
    if (!isResizing.value) {
      return
    }

    isResizing.value = false
    releaseCapture()

    // Clamped once more against the live bounds: the viewport can shrink
    // mid-drag (an OS window snap), and the resize listener deliberately
    // skips remeasuring while a drag is in flight.
    const settled = clampPaneSize(dragSize, min, resolveMax())
    size.value = settled
    persistPaneSize(storageKey, settled)
    applySize(settled)
  }

  function cancel() {
    if (!isResizing.value) {
      return
    }

    isResizing.value = false
    releaseCapture()
    // Snap back to the last committed size rather than leaving the pane at
    // wherever the abandoned drag happened to stop.
    dragSize = size.value
    applySize(size.value)
  }

  function commit(next: number) {
    const clamped = clampPaneSize(next, min, resolveMax())
    size.value = clamped
    dragSize = clamped
    persistPaneSize(storageKey, clamped)
    applySize(clamped)
  }

  function reset() {
    commit(defaultSize)
  }

  /**
   * Re-read the persisted size now that the bounds can actually be measured.
   * A `max` derived from a template ref is `undefined` while `size` is
   * initialised during setup — the range inverts, the clamp falls back to the
   * minimum, and every reload would wipe the persisted size. The same read
   * re-clamps a committed size when the viewport shrinks around it.
   * Deliberately does not persist: clamping on read keeps the wide-monitor
   * size stored so it comes back when the same page reopens there.
   */
  function remeasure() {
    if (isResizing.value) {
      return
    }

    const next = readStoredPaneSize(storageKey, defaultSize, min, resolveMax())
    size.value = next
    dragSize = next
    applySize(next)
  }

  function onKeydown(event: KeyboardEvent) {
    const grow = axis === 'x' ? 'ArrowLeft' : 'ArrowUp'
    const shrink = axis === 'x' ? 'ArrowRight' : 'ArrowDown'

    let next: number | null = null

    if (event.key === grow) {
      next = size.value + KEYBOARD_STEP
    } else if (event.key === shrink) {
      next = size.value - KEYBOARD_STEP
    } else if (event.key === 'PageUp') {
      next = size.value + KEYBOARD_PAGE_STEP
    } else if (event.key === 'PageDown') {
      next = size.value - KEYBOARD_PAGE_STEP
    } else if (event.key === 'Home') {
      next = resolveMax()
    } else if (event.key === 'End') {
      next = min
    }

    if (next === null) {
      return
    }
    event.preventDefault()

    commit(next)
  }

  // Registered only inside a component so the hook can also be driven bare,
  // as the tests do — there `remeasure` is called by hand.
  if (getCurrentInstance()) {
    // The initial read happens during setup, before template refs resolve;
    // re-read once the host has mounted and the bounds are measurable.
    onMounted(remeasure)

    if (typeof window !== 'undefined') {
      // Re-clamp when the viewport shrinks around a committed size, throttled
      // to a frame so resize storms measure the DOM at most once per paint.
      let frame: number | null = null
      const onWindowResize = () => {
        if (frame !== null) {
          return
        }
        frame = requestAnimationFrame(() => {
          frame = null
          remeasure()
        })
      }
      window.addEventListener('resize', onWindowResize)
      onScopeDispose(() => {
        window.removeEventListener('resize', onWindowResize)
        if (frame !== null) {
          cancelAnimationFrame(frame)
        }
      })
    }
  }

  // A route change mid-drag would otherwise tear the hook down with
  // `isResizing` still true, and every later drag early-returns on that flag.
  onScopeDispose(() => {
    if (isResizing.value) {
      isResizing.value = false
      releaseCapture()
    }
  })

  return {
    size,
    minSize: min,
    maxSize,
    isResizing,
    start,
    track,
    end,
    cancel,
    reset,
    remeasure,
    onKeydown,
  }
}
