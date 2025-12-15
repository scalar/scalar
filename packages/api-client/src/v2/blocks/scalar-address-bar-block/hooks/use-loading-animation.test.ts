import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLoadingAnimation } from './use-loading-animation'

describe('useLoadingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with percentage at 100', () => {
    const { percentage } = useLoadingAnimation()

    expect(percentage.value).toBe(100)
  })

  it('begins decreasing percentage when loading starts', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()
    vi.advanceTimersByTime(20)

    expect(percentage.value).toBeLessThan(100)
  })

  it('animates asymptotically during request, not going below 15%', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()

    // Advance through many ticks to approach the asymptotic limit
    for (let i = 0; i < 500; i++) {
      vi.advanceTimersByTime(20)
    }

    // Approaches but does not go significantly below 15%
    expect(percentage.value).toBeGreaterThan(14)
    expect(percentage.value).toBeLessThan(100)
  })

  it('does not start multiple intervals if called twice', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()
    const firstValue = percentage.value
    vi.advanceTimersByTime(20)
    const secondValue = percentage.value

    // Try to start again
    startLoading()
    vi.advanceTimersByTime(20)
    const thirdValue = percentage.value

    // Continues at the same rate, not double speed
    const firstDiff = firstValue - secondValue
    const secondDiff = secondValue - thirdValue

    expect(Math.abs(firstDiff - secondDiff)).toBeLessThan(1)
  })

  it('decreases percentage on each tick', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()
    const initial = percentage.value

    vi.advanceTimersByTime(20)
    const afterOneTick = percentage.value

    vi.advanceTimersByTime(20)
    const afterTwoTicks = percentage.value

    expect(afterOneTick).toBeLessThan(initial)
    expect(afterTwoTicks).toBeLessThan(afterOneTick)
  })

  it('animates linearly to completion after stopping', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    startLoading()
    vi.advanceTimersByTime(100)

    stopLoading()
    vi.advanceTimersByTime(20)
    const firstTick = percentage.value

    vi.advanceTimersByTime(20)
    const secondTick = percentage.value

    vi.advanceTimersByTime(20)
    const thirdTick = percentage.value

    // Linear animation means equal steps
    const firstDiff = firstTick - secondTick
    const secondDiff = secondTick - thirdTick

    // Roughly equal (allowing for small floating point differences)
    expect(Math.abs(firstDiff - secondDiff)).toBeLessThan(0.1)
  })

  it('resets to 100 when animation completes', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    startLoading()
    vi.advanceTimersByTime(100)
    stopLoading()
    vi.advanceTimersByTime(500)

    expect(percentage.value).toBe(100)
  })

  it('clears the interval when animation completes', () => {
    const { startLoading, stopLoading } = useLoadingAnimation()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    startLoading()
    vi.advanceTimersByTime(100)
    stopLoading()
    vi.advanceTimersByTime(500)

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('allows restarting after completion', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    // First cycle
    startLoading()
    vi.advanceTimersByTime(100)
    stopLoading()
    vi.advanceTimersByTime(500)

    expect(percentage.value).toBe(100)

    // Second cycle
    startLoading()
    vi.advanceTimersByTime(100)

    expect(percentage.value).toBeLessThan(100)
  })

  it('handles stopLoading called immediately after startLoading', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    startLoading()
    stopLoading()

    // Still completes the animation
    vi.advanceTimersByTime(500)

    expect(percentage.value).toBe(100)
  })

  it('handles multiple rapid start/stop cycles', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    // First cycle
    startLoading()
    vi.advanceTimersByTime(50)
    stopLoading()
    vi.advanceTimersByTime(200)

    // Second cycle before first completes
    const midCyclePercentage = percentage.value
    expect(midCyclePercentage).toBeGreaterThan(0)
    expect(midCyclePercentage).toBeLessThan(100)
  })

  it('handles startLoading called during finishing animation', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    // Start first request
    startLoading()
    vi.advanceTimersByTime(100)

    // Stop first request, starting the finishing animation
    stopLoading()
    const percentageWhenStopped = percentage.value

    // Advance partway through the finishing animation
    vi.advanceTimersByTime(100)

    // Percentage should decrease during finishing animation
    expect(percentage.value).toBeLessThan(percentageWhenStopped)
    const percentageDuringFinishing = percentage.value

    // Start a new request while finishing animation is still running
    startLoading()

    // Advance time - animation should continue but switch back to asymptotic mode
    vi.advanceTimersByTime(100)

    // Percentage should still be decreasing
    expect(percentage.value).toBeLessThan(percentageDuringFinishing)

    // Advance a lot of time without calling stopLoading
    // The animation should not complete (asymptotic mode stops near 15%)
    vi.advanceTimersByTime(10000)

    // Animation should not have completed, staying above asymptotic limit
    expect(percentage.value).toBeGreaterThan(14)
    expect(percentage.value).toBeLessThan(100)

    // Now stop the second request
    stopLoading()
    vi.advanceTimersByTime(500)

    // Now it should complete
    expect(percentage.value).toBe(100)
  })

  it('handles stopLoading called multiple times', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    startLoading()
    vi.advanceTimersByTime(100)

    stopLoading()
    const firstStop = percentage.value

    stopLoading()
    vi.advanceTimersByTime(20)

    // Does not cause errors or unexpected behavior
    expect(percentage.value).toBeLessThan(firstStop)
  })

  it('handles very long running requests', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()

    // Simulate a very long request
    vi.advanceTimersByTime(10000)

    // Stabilizes near the asymptotic limit
    expect(percentage.value).toBeGreaterThan(14)
    expect(percentage.value).toBeLessThan(20)
  })

  it('never completes without calling stopLoading', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()

    // Advance for a long time
    vi.advanceTimersByTime(20000)

    // Never completes on its own, stays near asymptotic limit
    expect(percentage.value).toBeGreaterThan(14)
    expect(percentage.value).toBeLessThan(100)
  })

  it('decreases faster at the beginning of the request', () => {
    const { startLoading, percentage } = useLoadingAnimation()

    startLoading()

    vi.advanceTimersByTime(20)
    const earlyDecrease = 100 - percentage.value

    // Reset and go to later in animation
    const { startLoading: startLoading2, percentage: percentage2 } = useLoadingAnimation()

    startLoading2()
    vi.advanceTimersByTime(1000)
    const beforeLateCheck = percentage2.value

    vi.advanceTimersByTime(20)
    const lateDecrease = beforeLateCheck - percentage2.value

    // Early decrease is larger than late decrease
    expect(earlyDecrease).toBeGreaterThan(lateDecrease)
  })

  it('uses linear formula after request completes', () => {
    const { startLoading, stopLoading, percentage } = useLoadingAnimation()

    startLoading()
    vi.advanceTimersByTime(100)

    stopLoading()
    const remainingAtStop = percentage.value

    vi.advanceTimersByTime(20)
    const afterFirstTick = percentage.value

    // Calculate expected decrease using linear formula
    // 400ms duration / 20ms tick = 20 ticks to complete
    const expectedDecreasePerTick = remainingAtStop / 20

    // Matches the formula (with small tolerance for floating point)
    expect(Math.abs(remainingAtStop - afterFirstTick - expectedDecreasePerTick)).toBeLessThan(0.01)
  })
})
