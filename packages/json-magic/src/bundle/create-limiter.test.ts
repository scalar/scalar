import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createLimiter } from './create-limiter'

describe('createLimiter', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('run in order and no more than the specified number of concurrent requests', async () => {
    vi.useFakeTimers()

    const limiter = createLimiter(2)

    let active = 0
    const maxObserved: Array<number> = []

    const makeTask = (id: number) =>
      limiter(async () => {
        active++
        maxObserved.push(active)
        await vi.advanceTimersByTimeAsync(100)
        active--
        return id
      })

    const tasks = [1, 2, 3, 4, 5].map(makeTask)

    await expect(Promise.all(tasks)).resolves.toEqual([1, 2, 3, 4, 5])
    expect(Math.max(...maxObserved)).toBe(2)
  })
})
