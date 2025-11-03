import { beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce } from './debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('executes the function after the default delay', () => {
    const { execute } = debounce()
    const fn = vi.fn()

    execute(['test'], fn)

    // Should not execute immediately
    expect(fn).not.toHaveBeenCalled()

    // Should execute after default delay (100ms)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('executes the function after a custom delay', () => {
    const { execute } = debounce({ delay: 500 })
    const fn = vi.fn()

    execute(['test'], fn)

    // Should not execute before the delay
    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()

    // Should execute after custom delay
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('executes the function with the correct context', () => {
    const { execute } = debounce()
    let executedValue = 0

    execute(['test'], () => {
      executedValue = 42
    })

    vi.advanceTimersByTime(100)
    expect(executedValue).toBe(42)
  })

  it('cancels previous calls with the same key', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const fn3 = vi.fn()

    execute(['user', '123'], fn1)
    vi.advanceTimersByTime(50)
    execute(['user', '123'], fn2)
    vi.advanceTimersByTime(50)
    execute(['user', '123'], fn3)

    // Only the last function should execute
    vi.advanceTimersByTime(100)
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
    expect(fn3).toHaveBeenCalledTimes(1)
  })

  it('resets the delay on each call with the same key', () => {
    const { execute } = debounce({ delay: 100 })
    const fn = vi.fn()

    execute(['test'], fn)
    vi.advanceTimersByTime(50)
    execute(['test'], fn)
    vi.advanceTimersByTime(50)
    execute(['test'], fn)

    // Should not have executed yet
    expect(fn).not.toHaveBeenCalled()

    // Should execute 100ms after the last call
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles different keys independently', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const fn3 = vi.fn()

    execute(['user', '123'], fn1)
    execute(['user', '456'], fn2)
    execute(['post', '789'], fn3)

    vi.advanceTimersByTime(100)

    // All functions should execute since they have different keys
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn3).toHaveBeenCalledTimes(1)
  })

  it('treats keys with different order as different keys', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    execute(['user', '123'], fn1)
    execute(['123', 'user'], fn2)

    vi.advanceTimersByTime(100)

    // Both should execute since key order differs
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('treats keys with different lengths as different keys', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    execute(['user'], fn1)
    execute(['user', '123'], fn2)

    vi.advanceTimersByTime(100)

    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('cancels all pending executions on cleanup', () => {
    const { execute, cleanup } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const fn3 = vi.fn()

    execute(['user', '123'], fn1)
    execute(['user', '456'], fn2)
    execute(['post', '789'], fn3)

    // Clean up before any execution
    cleanup()

    vi.advanceTimersByTime(100)

    // No functions should execute
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
    expect(fn3).not.toHaveBeenCalled()
  })

  it('allows new executions after cleanup', () => {
    const { execute, cleanup } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    execute(['test'], fn1)
    cleanup()

    // Schedule a new execution after cleanup
    execute(['test'], fn2)
    vi.advanceTimersByTime(100)

    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('handles cleanup when no executions are pending', () => {
    const { cleanup } = debounce()

    // Should not throw
    expect(() => cleanup()).not.toThrow()
  })

  it('handles cleanup after executions have completed', () => {
    const { execute, cleanup } = debounce({ delay: 100 })
    const fn = vi.fn()

    execute(['test'], fn)
    vi.advanceTimersByTime(100)

    // Should not throw
    expect(() => cleanup()).not.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles errors in the callback function', () => {
    const { execute } = debounce({ delay: 100 })
    const errorFn = vi.fn(() => {
      throw new Error('Test error')
    })

    execute(['test'], errorFn)

    // Should not throw during timer advance
    expect(() => vi.advanceTimersByTime(100)).not.toThrow()
    expect(errorFn).toHaveBeenCalledTimes(1)
  })

  it('cleans up timeout reference even when callback throws', () => {
    const { execute } = debounce({ delay: 100 })
    const errorFn = vi.fn(() => {
      throw new Error('Test error')
    })
    const successFn = vi.fn()

    execute(['test'], errorFn)
    vi.advanceTimersByTime(100)

    // Should be able to schedule another execution with the same key
    execute(['test'], successFn)
    vi.advanceTimersByTime(100)

    expect(successFn).toHaveBeenCalledTimes(1)
  })

  it('handles async functions', () => {
    const { execute } = debounce({ delay: 100 })
    const asyncFn = vi.fn().mockResolvedValue('result')

    execute(['test'], asyncFn)
    vi.advanceTimersByTime(100)

    expect(asyncFn).toHaveBeenCalledTimes(1)
  })

  it('handles rejected promises', () => {
    const { execute } = debounce({ delay: 100 })
    const rejectFn = vi.fn().mockRejectedValue(new Error('Async error'))

    execute(['test'], rejectFn)

    // Should not throw
    expect(() => vi.advanceTimersByTime(100)).not.toThrow()
    expect(rejectFn).toHaveBeenCalledTimes(1)
  })

  it('uses custom separator for key composition', () => {
    const { execute } = debounce({ delay: 100, separator: '::' })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    // These keys would collide with wrong separator
    execute(['user::123'], fn1)
    execute(['user', '123'], fn2)

    vi.advanceTimersByTime(100)

    // Both should execute since they are actually different
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('prevents collisions with default null byte separator', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    // These should be different keys with null byte separator
    execute(['user\x00123'], fn1)
    execute(['user', '123'], fn2)

    vi.advanceTimersByTime(100)

    // Both should execute
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('handles empty key array', () => {
    const { execute } = debounce({ delay: 100 })
    const fn = vi.fn()

    execute([], fn)
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles single element key', () => {
    const { execute } = debounce({ delay: 100 })
    const fn = vi.fn()

    execute(['single'], fn)
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles keys with empty strings', () => {
    const { execute } = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    execute(['', 'test'], fn1)
    execute(['test', ''], fn2)

    vi.advanceTimersByTime(100)

    // Should be different keys
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('handles zero delay', () => {
    const { execute } = debounce({ delay: 0 })
    const fn = vi.fn()

    execute(['test'], fn)

    // Should execute immediately when timer advances
    vi.advanceTimersByTime(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles very long delays', () => {
    const { execute } = debounce({ delay: 10000 })
    const fn = vi.fn()

    execute(['test'], fn)

    vi.advanceTimersByTime(9999)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles rapid successive calls', () => {
    const { execute } = debounce({ delay: 100 })
    const fn = vi.fn()

    // Call 100 times rapidly
    for (let i = 0; i < 100; i++) {
      execute(['test'], fn)
    }

    vi.advanceTimersByTime(100)

    // Should only execute once
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('maintains separate state for different instances', () => {
    const debouncer1 = debounce({ delay: 100 })
    const debouncer2 = debounce({ delay: 200 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    debouncer1.execute(['test'], fn1)
    debouncer2.execute(['test'], fn2)

    // First debouncer executes at 100ms
    vi.advanceTimersByTime(100)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()

    // Second debouncer executes at 200ms
    vi.advanceTimersByTime(100)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('does not interfere with each other when using cleanup on multiple instances', () => {
    const debouncer1 = debounce({ delay: 100 })
    const debouncer2 = debounce({ delay: 100 })
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    debouncer1.execute(['test'], fn1)
    debouncer2.execute(['test'], fn2)

    // Cleanup first debouncer
    debouncer1.cleanup()

    vi.advanceTimersByTime(100)

    // Only second should execute
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('does not capture or expose the return value', () => {
    const { execute } = debounce({ delay: 100 })
    const fn = vi.fn(() => 'return value')

    const result = execute(['test'], fn)

    // Execute returns void
    expect(result).toBeUndefined()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
