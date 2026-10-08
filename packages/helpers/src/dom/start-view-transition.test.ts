import { afterEach, describe, expect, it, vi } from 'vitest'

import { startViewTransition, supportsViewTransitions } from './start-view-transition'

type TransitionStub = {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  skipTransition: () => void
}

/** Mirrors the browser API closely enough: the callback runs and every promise settles */
const stubViewTransition = (options: { skipped?: boolean } = {}) => {
  const startViewTransitionMock = vi.fn((update: () => void | Promise<void>): TransitionStub => {
    const updateCallbackDone = Promise.resolve().then(update)
    const ready = options.skipped
      ? updateCallbackDone.then(() => Promise.reject(new Error('skipped')))
      : updateCallbackDone
    const finished = updateCallbackDone

    return { finished, ready, updateCallbackDone, skipTransition: vi.fn() }
  })

  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    writable: true,
    value: startViewTransitionMock,
  })

  return startViewTransitionMock
}

const stubReducedMotion = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: query.includes('prefers-reduced-motion') && matches, media: query })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'startViewTransition')
})

describe('start-view-transition', () => {
  describe('supportsViewTransitions', () => {
    it('returns false without the API', () => {
      expect(supportsViewTransitions()).toBe(false)
    })

    it('returns true with the API and no motion preference', () => {
      stubViewTransition()
      expect(supportsViewTransitions()).toBe(true)
    })

    it('returns false when reduced motion is preferred', () => {
      stubViewTransition()
      stubReducedMotion(true)
      expect(supportsViewTransitions()).toBe(false)
    })

    it('returns false without a document', () => {
      stubViewTransition()
      vi.stubGlobal('document', undefined)
      expect(supportsViewTransitions()).toBe(false)
    })
  })

  describe('startViewTransition', () => {
    it('runs the callback and resolves when the API is missing', async () => {
      const update = vi.fn()

      await startViewTransition(update)

      expect(update).toHaveBeenCalledOnce()
    })

    it('runs the callback through document.startViewTransition when available', async () => {
      const api = stubViewTransition()
      const update = vi.fn()

      await startViewTransition(update)

      expect(api).toHaveBeenCalledOnce()
      expect(update).toHaveBeenCalledOnce()
    })

    it('skips the API when reduced motion is preferred', async () => {
      const api = stubViewTransition()
      stubReducedMotion(true)
      const update = vi.fn()

      await startViewTransition(update)

      expect(api).not.toHaveBeenCalled()
      expect(update).toHaveBeenCalledOnce()
    })

    it('resolves even when the transition is skipped', async () => {
      stubViewTransition({ skipped: true })
      const update = vi.fn()

      await expect(startViewTransition(update)).resolves.toBeUndefined()
      expect(update).toHaveBeenCalledOnce()
    })
  })
})
