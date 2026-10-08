import { afterEach, describe, expect, it, vi } from 'vitest'

import { EXPLORE_VT_ATTRIBUTE } from './constants'
import { useExploreScalarTransition } from './use-explore-scalar-transition'

/** Stubs the browser API so the callback runs and, optionally, the transition reports itself as skipped */
const stubViewTransition = ({ skipped = false }: { skipped?: boolean } = {}) => {
  const api = vi.fn((update: () => void | Promise<void>) => {
    const updateCallbackDone = Promise.resolve().then(update)
    const ready = skipped ? updateCallbackDone.then(() => Promise.reject(new Error('skipped'))) : updateCallbackDone

    return { finished: updateCallbackDone, ready, updateCallbackDone, skipTransition: vi.fn() }
  })

  Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: api })

  return api
}

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  document.documentElement.removeAttribute(EXPLORE_VT_ATTRIBUTE)
})

describe('use-explore-scalar-transition', () => {
  it('runs the update directly when view transitions are unsupported', async () => {
    const { run, isTransitioning, usesViewTransition } = useExploreScalarTransition()
    const update = vi.fn(() => {
      expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
      return Promise.resolve()
    })

    await run('open', update)

    expect(update).toHaveBeenCalledOnce()
    expect(isTransitioning.value).toBe(false)
    expect(usesViewTransition.value).toBe(false)
  })

  it('sets and removes the root attribute around a transition', async () => {
    const api = stubViewTransition()
    const { run, isTransitioning } = useExploreScalarTransition()
    const seen: { attribute: string | null; transitioning: boolean }[] = []

    await run('close', () => {
      seen.push({
        attribute: document.documentElement.getAttribute(EXPLORE_VT_ATTRIBUTE),
        transitioning: isTransitioning.value,
      })
      return Promise.resolve()
    })

    expect(api).toHaveBeenCalledOnce()
    expect(seen).toEqual([{ attribute: 'close', transitioning: true }])
    expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
    expect(isTransitioning.value).toBe(false)
  })

  it('clears isTransitioning even when the transition is skipped', async () => {
    stubViewTransition({ skipped: true })
    const { run, isTransitioning } = useExploreScalarTransition()

    await expect(run('open', () => Promise.resolve())).resolves.toBeUndefined()

    expect(isTransitioning.value).toBe(false)
    expect(document.documentElement.hasAttribute(EXPLORE_VT_ATTRIBUTE)).toBe(false)
  })
})
