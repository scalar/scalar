import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce } from './debounce'

describe('Functions are debounced', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Debounce function', () => {
    const func = vi.fn()
    const debouncedFunc = debounce(func, 1000)

    // Call it immediately
    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(0) // func not called

    // Call it several times with 500ms between each call
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(500)
      debouncedFunc()
    }
    expect(func).toHaveBeenCalledTimes(0) // func not called

    // wait 1000ms
    vi.advanceTimersByTime(1000)
    expect(func).toHaveBeenCalledTimes(1) // func called
  })

  it('Debounce function with max wait', () => {
    const func = vi.fn()
    const debouncedFunc = debounce(func, 1000, { maxWait: 2000 })

    // Call it immediately
    debouncedFunc()
    expect(func).toHaveBeenCalledTimes(0) // func not called

    // Call it several times with 500ms between each call
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(500)
      debouncedFunc()
    }
    expect(func).toHaveBeenCalledTimes(2) // func is called twice because max wait is reached every 4 x 500ms
  })
})
