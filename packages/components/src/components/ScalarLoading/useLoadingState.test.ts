import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLoadingState } from './useLoadingState'

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with all flags set to false', () => {
    const loader = useLoadingState()

    expect(loader.isLoading).toBe(false)
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isActive).toBe(false)
  })

  it('sets isLoading and isActive to true when start is called', () => {
    const loader = useLoadingState()

    loader.start()

    expect(loader.isLoading).toBe(true)
    expect(loader.isActive).toBe(true)
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
  })

  it('sets isActive to true when validate is called', () => {
    const loader = useLoadingState()

    loader.validate()

    expect(loader.isActive).toBe(true)
    expect(loader.isValid).toBe(true)
    expect(loader.isLoading).toBe(false)
  })

  it('sets isActive to true when invalidate is called', () => {
    const loader = useLoadingState()

    loader.invalidate()

    expect(loader.isActive).toBe(true)
    expect(loader.isInvalid).toBe(true)
    expect(loader.isLoading).toBe(false)
  })

  it('validates successfully with default options', async () => {
    const loader = useLoadingState()
    loader.start()

    const promise = loader.validate()

    // Immediately after calling validate, state should be updated
    expect(loader.isLoading).toBe(false)
    expect(loader.isValid).toBe(true)
    expect(loader.isInvalid).toBe(false)

    // When persist is false, validate calls clear() after duration - 300ms (800ms)
    // Default duration is 1100ms, minus 300ms = 800ms
    // Then clear() takes 300ms, so total is 1100ms
    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    await promise

    // When persist is false, validate calls clear() internally, so state should be cleared
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isLoading).toBe(false)
    expect(loader.isActive).toBe(false)
  })

  it('validates successfully with custom duration', async () => {
    const loader = useLoadingState()
    const customDuration = 1000

    const promise = loader.validate({ duration: customDuration })

    expect(loader.isValid).toBe(true)

    // Custom duration minus 300ms = 700ms, then clear() takes 300ms
    await vi.advanceTimersByTimeAsync(700)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    await promise

    // When persist is false, validate calls clear() internally
    expect(loader.isValid).toBe(false)
  })

  it('validates successfully with persist option set to true', async () => {
    const loader = useLoadingState()

    const promise = loader.validate({ persist: true })

    expect(loader.isValid).toBe(true)

    // When persist is true, duration is not reduced, so 1100ms total
    // clear() is NOT called, so it resolves after 1100ms
    await vi.advanceTimersByTimeAsync(1100)

    await promise

    // When persist is true, validate does NOT call clear(), so state remains valid
    expect(loader.isValid).toBe(true)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isLoading).toBe(false)
    expect(loader.isActive).toBe(true)
  })

  it('validates successfully with both custom duration and persist', async () => {
    const loader = useLoadingState()
    const customDuration = 1500

    const promise = loader.validate({ duration: customDuration, persist: true })

    expect(loader.isValid).toBe(true)

    // When persist is true, full duration is used, clear() is NOT called
    await vi.advanceTimersByTimeAsync(customDuration)

    await promise

    // When persist is true, validate does NOT call clear(), so state remains valid
    expect(loader.isValid).toBe(true)
  })

  it('invalidates with default options', async () => {
    const loader = useLoadingState()
    loader.start()

    const promise = loader.invalidate()

    // Immediately after calling invalidate, state should be updated
    expect(loader.isLoading).toBe(false)
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(true)

    // Default duration is 1100ms, minus 300ms = 800ms
    // Then clear() is called which takes 300ms, so total is 1100ms
    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    await promise

    // When persist is false, invalidate calls clear() internally
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isLoading).toBe(false)
  })

  it('invalidates with custom duration', async () => {
    const loader = useLoadingState()
    const customDuration = 2000

    const promise = loader.invalidate({ duration: customDuration })

    expect(loader.isInvalid).toBe(true)

    // Custom duration minus 300ms = 1700ms, then clear() takes 300ms
    await vi.advanceTimersByTimeAsync(1700)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    await promise

    expect(loader.isInvalid).toBe(false)
  })

  it('invalidates with persist option set to true', async () => {
    const loader = useLoadingState()

    const promise = loader.invalidate({ persist: true })

    expect(loader.isInvalid).toBe(true)

    // When persist is true, duration is not reduced by 300ms, so 1100ms total
    await vi.advanceTimersByTimeAsync(1100)

    await promise

    // State should still be invalid after promise resolves when persist is true
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(true)
    expect(loader.isLoading).toBe(false)
  })

  it('invalidates with both custom duration and persist', async () => {
    const loader = useLoadingState()
    const customDuration = 2500

    const promise = loader.invalidate({ duration: customDuration, persist: true })

    expect(loader.isInvalid).toBe(true)

    // When persist is true, full duration is used
    await vi.advanceTimersByTimeAsync(customDuration)

    await promise

    expect(loader.isInvalid).toBe(true)
  })

  it('clears all state flags with default duration', async () => {
    const loader = useLoadingState()
    loader.isValid = true
    loader.isInvalid = true
    loader.isLoading = true
    loader.isActive = true

    const promise = loader.clear()

    // Immediately after calling clear, all flags should be false except isActive
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isLoading).toBe(false)
    // isActive is set to false after the duration
    expect(loader.isActive).toBe(true)

    // Default duration is 300ms
    await vi.advanceTimersByTimeAsync(300)

    await promise

    // State should remain cleared, and isActive should now be false
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
    expect(loader.isLoading).toBe(false)
    expect(loader.isActive).toBe(false)
  })

  it('clears all state flags with custom duration', async () => {
    const loader = useLoadingState()
    loader.isValid = true
    const customDuration = 500

    const promise = loader.clear({ duration: customDuration })

    expect(loader.isValid).toBe(false)

    await vi.advanceTimersByTimeAsync(customDuration)

    await promise

    expect(loader.isValid).toBe(false)
  })

  it('allows promise chaining after validate', async () => {
    const loader = useLoadingState()
    const callback = vi.fn()

    loader.validate().then(callback)

    // Default validate: 1100ms - 300ms = 800ms, then clear() takes 300ms
    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    expect(callback).toHaveBeenCalled()
  })

  it('allows promise chaining after invalidate', async () => {
    const loader = useLoadingState()
    const callback = vi.fn()

    loader.invalidate().then(callback)

    // Default invalidate: 1100ms - 300ms = 800ms, then clear() takes 300ms
    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration

    expect(callback).toHaveBeenCalled()
  })

  it('allows promise chaining after clear', async () => {
    const loader = useLoadingState()
    const callback = vi.fn()

    loader.clear().then(callback)

    await vi.advanceTimersByTimeAsync(300)

    expect(callback).toHaveBeenCalled()
  })

  it('handles sequential state transitions', async () => {
    const loader = useLoadingState()

    // Start loading
    loader.start()
    expect(loader.isLoading).toBe(true)

    // Validate (persist defaults to false, so it will clear)
    const validatePromise = loader.validate()
    expect(loader.isValid).toBe(true)
    expect(loader.isLoading).toBe(false)

    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration
    await validatePromise

    // When persist is false, validate calls clear() internally
    expect(loader.isValid).toBe(false)
    expect(loader.isActive).toBe(false)

    // Invalidate (persist defaults to false, so it will clear)
    const invalidatePromise = loader.invalidate()
    expect(loader.isInvalid).toBe(true)

    await vi.advanceTimersByTimeAsync(800)
    await vi.advanceTimersByTimeAsync(300) // clear() duration
    await invalidatePromise

    // Should be cleared after invalidate completes
    expect(loader.isInvalid).toBe(false)
  })

  it('handles validate with persist followed by clear', async () => {
    const loader = useLoadingState()

    const validatePromise = loader.validate({ persist: true })
    expect(loader.isValid).toBe(true)

    // When persist is true, validate waits full duration without calling clear()
    await vi.advanceTimersByTimeAsync(1100)
    await validatePromise

    // State should remain valid after validate completes (since persist does NOT call clear)
    expect(loader.isValid).toBe(true)
    expect(loader.isActive).toBe(true)

    // Now clear it manually
    const clearPromise = loader.clear()
    expect(loader.isValid).toBe(false)

    await vi.advanceTimersByTimeAsync(300)
    await clearPromise

    expect(loader.isValid).toBe(false)
  })

  it('handles invalidate with persist followed by clear', async () => {
    const loader = useLoadingState()

    const invalidatePromise = loader.invalidate({ persist: true })
    expect(loader.isInvalid).toBe(true)

    await vi.advanceTimersByTimeAsync(1100)
    await invalidatePromise

    // State should still be invalid
    expect(loader.isInvalid).toBe(true)

    // Now clear it
    const clearPromise = loader.clear()
    expect(loader.isInvalid).toBe(false)

    await vi.advanceTimersByTimeAsync(300)
    await clearPromise

    expect(loader.isInvalid).toBe(false)
  })

  it('returns a reactive object', () => {
    const loader = useLoadingState()

    // Verify it's reactive by checking that changes are reflected
    loader.start()
    expect(loader.isLoading).toBe(true)
    expect(loader.isActive).toBe(true)

    loader.clear()
    expect(loader.isLoading).toBe(false)
    expect(loader.isValid).toBe(false)
    expect(loader.isInvalid).toBe(false)
  })
})
