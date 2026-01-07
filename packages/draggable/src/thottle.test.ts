import { beforeEach, describe, expect, it, vi } from 'vitest'

import { throttle } from './throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('should throttle a function', async () => {
    vi.useFakeTimers()

    const fn = vi.fn()

    const throttledFn = throttle(fn, 100)

    throttledFn()
    throttledFn()
    throttledFn()
    throttledFn()
    throttledFn()

    await vi.advanceTimersByTimeAsync(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
