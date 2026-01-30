import { beforeEach, describe, expect, it, vi } from 'vitest'

import { waitForCondition } from './wait-for-condition'

describe('waitForCondition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('resolves immediately when condition is already true', async () => {
    const checkCondition = vi.fn(() => true)

    const promise = waitForCondition(checkCondition)
    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(1)
  })

  it('resolves when condition becomes true after one check', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 1
    })

    const promise = waitForCondition(checkCondition)

    // Advance time by one check interval (default 100ms)
    await vi.advanceTimersByTimeAsync(100)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(2)
  })

  it('resolves when condition becomes true after multiple checks', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 5
    })

    const promise = waitForCondition(checkCondition)

    // Advance time by 5 check intervals (500ms total)
    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(6)
  })

  it('returns false when condition never becomes true and timeout is reached', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, { maxWaitTime: 1000 })

    // Advance time past the max wait time
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe(false)
    // Called once immediately, then 10 times at 100ms intervals
    expect(checkCondition).toHaveBeenCalledTimes(11)
  })

  it('uses custom check interval', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 3
    })

    const promise = waitForCondition(checkCondition, { checkInterval: 50 })

    // Advance time by 3 check intervals (150ms total at 50ms each)
    await vi.advanceTimersByTimeAsync(150)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(4)
  })

  it('uses custom max wait time', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, {
      checkInterval: 100,
      maxWaitTime: 500,
    })

    // Advance time to reach max wait time
    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result).toBe(false)
    // Called once immediately, then 5 times at 100ms intervals
    expect(checkCondition).toHaveBeenCalledTimes(6)
  })

  it('uses both custom check interval and max wait time', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 10
    })

    const promise = waitForCondition(checkCondition, {
      checkInterval: 50,
      maxWaitTime: 1000,
    })

    // Advance time by 10 check intervals (500ms total)
    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(11)
  })

  it('handles very short check intervals', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 5
    })

    const promise = waitForCondition(checkCondition, {
      checkInterval: 10,
      maxWaitTime: 1000,
    })

    // Advance time by 5 check intervals (50ms total)
    await vi.advanceTimersByTimeAsync(50)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(6)
  })

  it('handles very long max wait times', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, {
      checkInterval: 100,
      maxWaitTime: 10000,
    })

    // Advance time to reach max wait time
    await vi.advanceTimersByTimeAsync(10000)

    const result = await promise

    expect(result).toBe(false)
    // Called once immediately, then 100 times at 100ms intervals
    expect(checkCondition).toHaveBeenCalledTimes(101)
  })

  it('resolves exactly at timeout boundary when condition becomes true', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      // Becomes true on the 10th check (at 900ms elapsed)
      return callCount === 10
    })

    const promise = waitForCondition(checkCondition, {
      checkInterval: 100,
      maxWaitTime: 1000,
    })

    // Advance time to just before the condition becomes true
    await vi.advanceTimersByTimeAsync(900)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(10)
  })

  it('returns false when timeout is reached just before condition would become true', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      // Would become true on the 12th check (at 1100ms elapsed)
      return callCount === 12
    })

    const promise = waitForCondition(checkCondition, {
      checkInterval: 100,
      maxWaitTime: 1000,
    })

    // Advance time to reach max wait time
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe(false)
    // Called once immediately, then 10 times at 100ms intervals
    expect(checkCondition).toHaveBeenCalledTimes(11)
  })

  it('handles condition that throws an error', async () => {
    const checkCondition = vi.fn(() => {
      throw new Error('Test error')
    })

    const promise = waitForCondition(checkCondition, { maxWaitTime: 500 })

    // The function does not handle errors, so it will throw
    await expect(promise).rejects.toThrow('Test error')
  })

  it('handles empty options object', async () => {
    const checkCondition = vi.fn(() => true)

    const promise = waitForCondition(checkCondition, {})
    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(1)
  })

  it('handles undefined options', async () => {
    const checkCondition = vi.fn(() => true)

    const promise = waitForCondition(checkCondition)
    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(1)
  })

  it('uses default checkInterval when only maxWaitTime is provided', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, { maxWaitTime: 500 })

    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result).toBe(false)
    // Default checkInterval is 100ms, so 6 calls total
    expect(checkCondition).toHaveBeenCalledTimes(6)
  })

  it('uses default maxWaitTime when only checkInterval is provided', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, { checkInterval: 50 })

    // Default maxWaitTime is 3000ms
    await vi.advanceTimersByTimeAsync(3000)

    const result = await promise

    expect(result).toBe(false)
    // 3000ms / 50ms = 60 intervals + 1 immediate check
    expect(checkCondition).toHaveBeenCalledTimes(61)
  })

  it('handles condition that becomes true then false', async () => {
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      // True only on the 3rd call
      return callCount === 3
    })

    const promise = waitForCondition(checkCondition)

    // Advance time to reach the 3rd check
    await vi.advanceTimersByTimeAsync(200)

    const result = await promise

    expect(result).toBe(true)
    expect(checkCondition).toHaveBeenCalledTimes(3)
  })

  it('handles zero as maxWaitTime', async () => {
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, {
      checkInterval: 100,
      maxWaitTime: 0,
    })

    // Advance time to trigger the interval check
    await vi.advanceTimersByTimeAsync(100)

    const result = await promise

    expect(result).toBe(false)
    // Called once immediately, then once more at 100ms which exceeds maxWaitTime of 0
    expect(checkCondition).toHaveBeenCalledTimes(2)
  })

  it('clears interval when condition becomes true to avoid memory leaks', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    let callCount = 0
    const checkCondition = vi.fn(() => {
      callCount++
      return callCount > 2
    })

    const promise = waitForCondition(checkCondition)

    await vi.advanceTimersByTimeAsync(200)
    await promise

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears interval when timeout is reached to avoid memory leaks', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const checkCondition = vi.fn(() => false)

    const promise = waitForCondition(checkCondition, { maxWaitTime: 500 })

    await vi.advanceTimersByTimeAsync(500)
    await promise

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
