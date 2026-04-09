import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLimiter } from './create-limiter'

describe('create-limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('run in order and no more than the specified number of concurrent requests', async () => {
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

  it('queues additional tasks until a slot is available', async () => {
    const limiter = createLimiter(1)
    const started: Array<number> = []

    const makeTask = (id: number) =>
      limiter(async () => {
        started.push(id)
        await vi.advanceTimersByTimeAsync(100)
        return id
      })

    const tasks = [1, 2, 3].map(makeTask)

    // Only the first task starts immediately when limit is 1.
    expect(started).toEqual([1])

    await Promise.all(tasks)
    expect(started).toEqual([1, 2, 3])
  })

  it('releases the next queued task after a rejection', async () => {
    const limiter = createLimiter(1)
    const events: Array<string> = []
    const error = new Error('boom')

    const first = limiter(async () => {
      events.push('first:start')
      await vi.advanceTimersByTimeAsync(100)
      events.push('first:reject')
      throw error
    })

    const second = limiter(async () => {
      events.push('second:start')
      await vi.advanceTimersByTimeAsync(100)
      events.push('second:resolve')
      return 'ok'
    })

    await expect(first).rejects.toThrow('boom')
    await expect(second).resolves.toBe('ok')
    expect(events).toEqual(['first:start', 'first:reject', 'second:start', 'second:resolve'])
  })

  it('does not queue when concurrency limit is larger than task count', async () => {
    const limiter = createLimiter(10)
    let active = 0
    const maxObserved: Array<number> = []
    const releases: Array<() => void> = []

    const makeTask = (id: number) =>
      limiter(async () => {
        active++
        maxObserved.push(active)
        await new Promise<void>((resolve) => releases.push(resolve))
        active--
        return id
      })

    const tasks = [1, 2, 3].map(makeTask)

    // All tasks should start immediately because the limit is not reached.
    expect(releases).toHaveLength(3)
    expect(Math.max(...maxObserved)).toBe(3)

    releases.forEach((release) => release())
    await expect(Promise.all(tasks)).resolves.toEqual([1, 2, 3])
  })

  it('runs immediate tasks in order when limit is one', async () => {
    const limiter = createLimiter(1)
    const started: Array<number> = []

    const makeTask = (id: number) =>
      limiter(() => {
        started.push(id)
        return Promise.resolve(id)
      })

    await expect(Promise.all([1, 2, 3, 4, 5].map(makeTask))).resolves.toEqual([1, 2, 3, 4, 5])
    expect(started).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps draining the queue through mixed failures and successes', async () => {
    const limiter = createLimiter(1)
    const started: Array<number> = []

    const tasks = [
      limiter(() => {
        started.push(1)
        return Promise.reject(new Error('first failed'))
      }),
      limiter(() => {
        started.push(2)
        return Promise.resolve('second ok')
      }),
      limiter(() => {
        started.push(3)
        return Promise.reject(new Error('third failed'))
      }),
      limiter(() => {
        started.push(4)
        return Promise.resolve('fourth ok')
      }),
    ]

    const results = await Promise.allSettled(tasks)

    expect(started).toEqual([1, 2, 3, 4])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled', 'rejected', 'fulfilled'])
  })
})
