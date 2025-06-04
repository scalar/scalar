import { describe, it, expect, vi } from 'vitest'
import { sleep } from './sleep'

describe('sleep', () => {
  it('should wait for the specified milliseconds', async () => {
    vi.useFakeTimers()

    const waitTime = 100
    const sleepPromise = sleep(waitTime)

    // Fast-forward time
    vi.advanceTimersByTime(waitTime)

    await sleepPromise

    vi.useRealTimers()
  })

  it('should resolve immediately when given 0 milliseconds', async () => {
    const start = Date.now()
    await sleep(0)
    const end = Date.now()

    expect(end - start).toBeLessThan(10)
  })

  it('should handle negative values by treating them as 0', async () => {
    const start = Date.now()
    await sleep(-100)
    const end = Date.now()

    expect(end - start).toBeLessThan(10)
  })
})
