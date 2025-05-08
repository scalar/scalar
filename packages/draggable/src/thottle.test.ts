import { throttle } from './throttle'
import { it, describe, expect, vi } from 'vitest'

describe('throttle', () => {
  it('should throttle a function', async () => {
    const fn = vi.fn()

    const throttledFn = throttle(fn, 100)

    throttledFn()
    throttledFn()
    throttledFn()
    throttledFn()
    throttledFn()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
