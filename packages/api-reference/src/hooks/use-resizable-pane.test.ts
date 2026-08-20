// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type ResizablePaneOptions,
  clampPaneSize,
  persistPaneSize,
  readStoredPaneSize,
  useResizablePane,
} from './use-resizable-pane'

const KEY = 'api-reference.test-pane.size'

beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

/**
 * A drag harness: the pointer events the hook needs, plus a stub handle so
 * pointer capture is a no-op rather than a jsdom error. The stub records
 * `setAttribute` so tests can watch the imperative `aria-valuenow` writes.
 */
function makeHandle() {
  return {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    setAttribute: vi.fn(),
  }
}

function pointerEvent(coordinate: number, axis: 'x' | 'y' = 'x', handle = makeHandle()) {
  return {
    button: 0,
    buttons: 1,
    pointerId: 1,
    currentTarget: handle,
    clientX: axis === 'x' ? coordinate : 0,
    clientY: axis === 'y' ? coordinate : 0,
    preventDefault: vi.fn(),
  } as unknown as PointerEvent
}

/** An end-anchored pane, the agent panel shape. */
function setup(overrides: Partial<ResizablePaneOptions> = {}) {
  const apply = vi.fn()

  const pane = useResizablePane({
    anchor: 'end',
    min: 200,
    max: 800,
    defaultSize: 400,
    storageKey: KEY,
    // The pane's far edge sits at x=1000, so a pointer at x=600 is 400 wide.
    measureEdge: () => 1000,
    apply,
    ...overrides,
  })

  return { pane, apply }
}

describe('use-resizable-pane', () => {
  describe('clampPaneSize', () => {
    it('holds the value inside its range', () => {
      expect(clampPaneSize(500, 200, 800)).toBe(500)
      expect(clampPaneSize(100, 200, 800)).toBe(200)
      expect(clampPaneSize(900, 200, 800)).toBe(800)
    })

    it('falls back to the minimum when the range inverts', () => {
      expect(clampPaneSize(500, 400, 300)).toBe(400)
    })

    it('falls back to the minimum for a non-finite value', () => {
      expect(clampPaneSize(Number.NaN, 200, 800)).toBe(200)
    })
  })

  describe('readStoredPaneSize', () => {
    it('returns the fallback when nothing is stored', () => {
      expect(readStoredPaneSize(KEY, 400, 200, 800)).toBe(400)
    })

    it('clamps a stored size that no longer fits', () => {
      persistPaneSize(KEY, 700)
      expect(readStoredPaneSize(KEY, 400, 200, 640)).toBe(640)
    })

    it('falls back when the stored value is not a number', () => {
      window.localStorage.setItem(KEY, 'wide')
      expect(readStoredPaneSize(KEY, 400, 200, 800)).toBe(400)
    })

    it('survives storage throwing, as it does in private mode', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied')
      })
      expect(readStoredPaneSize(KEY, 400, 200, 800)).toBe(400)
    })

    it('clamps the fallback itself, not only stored values', () => {
      expect(readStoredPaneSize(KEY, 900, 200, 800)).toBe(800)
    })
  })

  describe('remeasure', () => {
    it('recovers the stored size once the bounds can be measured', () => {
      persistPaneSize(KEY, 600)

      // A max of 0 during setup inverts the range and the size falls back.
      let max = 0
      const { pane } = setup({ max: () => max })
      expect(pane.size.value).toBe(200)

      max = 800
      pane.remeasure()
      expect(pane.size.value).toBe(600)
    })

    it('re-clamps a committed size when the viewport shrinks around it', () => {
      persistPaneSize(KEY, 700)

      let max = 800
      const { pane } = setup({ max: () => max })
      expect(pane.size.value).toBe(700)

      max = 500
      pane.remeasure()
      expect(pane.size.value).toBe(500)
      // The wide-monitor size stays stored so it comes back there.
      expect(window.localStorage.getItem(KEY)).toBe('700')
    })

    it('publishes the measured bound, floored at the minimum', () => {
      const { pane } = setup({ max: () => 100 })
      pane.remeasure()
      expect(pane.maxSize.value).toBe(200)
    })
  })

  describe('drag', () => {
    it('tracks the pointer as distance back from the measured edge', () => {
      const { pane, apply } = setup()

      pane.start(pointerEvent(600))
      pane.track(pointerEvent(700))

      expect(apply).toHaveBeenLastCalledWith(300)
    })

    it('commits and persists the size on release', () => {
      const { pane } = setup()

      pane.start(pointerEvent(600))
      pane.track(pointerEvent(500))
      pane.end()

      expect(pane.size.value).toBe(500)
      expect(window.localStorage.getItem(KEY)).toBe('500')
      expect(pane.isResizing.value).toBe(false)
    })

    it('writes aria-valuenow to the handle per move, not per render', () => {
      const handle = makeHandle()
      const { pane } = setup()

      pane.start(pointerEvent(600, 'x', handle))
      pane.track(pointerEvent(650, 'x', handle))

      expect(handle.setAttribute).toHaveBeenCalledWith('aria-valuenow', '350')
    })

    it('clamps the drag to the allowed range', () => {
      const { pane, apply } = setup()

      pane.start(pointerEvent(600))
      pane.track(pointerEvent(0))
      expect(apply).toHaveBeenLastCalledWith(800)

      pane.track(pointerEvent(990))
      expect(apply).toHaveBeenLastCalledWith(200)
    })

    it('ignores a non-primary button so no drag is left hanging', () => {
      const { pane } = setup()

      pane.start({ ...pointerEvent(600), button: 2 } as unknown as PointerEvent)

      expect(pane.isResizing.value).toBe(false)
    })

    it('refuses to start when the edge cannot be measured', () => {
      const { pane } = setup({ measureEdge: () => undefined })

      pane.start(pointerEvent(600))

      expect(pane.isResizing.value).toBe(false)
    })

    it('settles when a move arrives with no button held', () => {
      const { pane } = setup()

      pane.start(pointerEvent(600))
      pane.track(pointerEvent(500))
      pane.track({ ...pointerEvent(400), buttons: 0 } as unknown as PointerEvent)

      // The missed release settles at the last dragged size, not the hover.
      expect(pane.isResizing.value).toBe(false)
      expect(pane.size.value).toBe(500)
    })

    it('cancel snaps back to the committed size', () => {
      const { pane, apply } = setup()

      pane.start(pointerEvent(600))
      pane.track(pointerEvent(500))
      pane.cancel()

      expect(pane.size.value).toBe(400)
      expect(apply).toHaveBeenLastCalledWith(400)
      expect(window.localStorage.getItem(KEY)).toBeNull()
    })

    it('measures a start-anchored pane away from its edge', () => {
      const { pane, apply } = setup({ anchor: 'start', measureEdge: () => 100 })

      pane.start(pointerEvent(400))
      pane.track(pointerEvent(500))

      expect(apply).toHaveBeenLastCalledWith(400)
    })
  })

  describe('reset', () => {
    it('restores and persists the default size', () => {
      persistPaneSize(KEY, 700)
      const { pane } = setup()
      expect(pane.size.value).toBe(700)

      pane.reset()

      expect(pane.size.value).toBe(400)
      expect(window.localStorage.getItem(KEY)).toBe('400')
    })
  })

  describe('keyboard', () => {
    function keyEvent(key: string) {
      return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent
    }

    it('grows and shrinks by the arrow step', () => {
      const { pane } = setup()

      pane.onKeydown(keyEvent('ArrowLeft'))
      expect(pane.size.value).toBe(416)

      pane.onKeydown(keyEvent('ArrowRight'))
      expect(pane.size.value).toBe(400)
    })

    it('flips the arrow direction for a start-anchored pane', () => {
      // A start-anchored pane (the right-to-left agent panel) grows toward the
      // pointer as it moves away from the left edge, so the keyboard must grow
      // it with ArrowRight — the mirror of the end-anchored default.
      const { pane } = setup({ anchor: 'start', measureEdge: () => 0 })

      pane.onKeydown(keyEvent('ArrowRight'))
      expect(pane.size.value).toBe(416)

      pane.onKeydown(keyEvent('ArrowLeft'))
      expect(pane.size.value).toBe(400)
    })

    it('pages by the larger step', () => {
      const { pane } = setup()

      pane.onKeydown(keyEvent('PageUp'))
      expect(pane.size.value).toBe(464)

      pane.onKeydown(keyEvent('PageDown'))
      expect(pane.size.value).toBe(400)
    })

    it('jumps to the bounds with Home and End', () => {
      const { pane } = setup()

      pane.onKeydown(keyEvent('Home'))
      expect(pane.size.value).toBe(800)

      pane.onKeydown(keyEvent('End'))
      expect(pane.size.value).toBe(200)
    })

    it('persists keyboard commits', () => {
      const { pane } = setup()

      pane.onKeydown(keyEvent('ArrowLeft'))

      expect(window.localStorage.getItem(KEY)).toBe('416')
    })

    it('leaves unrelated keys alone', () => {
      const { pane } = setup()
      const event = keyEvent('Tab')

      pane.onKeydown(event)

      expect(pane.size.value).toBe(400)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })
})
