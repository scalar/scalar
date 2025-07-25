import { describe, expect, it } from 'vitest'
import { createLimiter } from './create-limiter'

describe('createLimiter', { timeout: 10000 }, () => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  it('run in order and no more than the specified number of concurrent requests', async () => {
    const limiter = createLimiter(2)

    let active = 0
    const maxObserved: number[] = []

    const makeTask = (id: number) =>
      limiter(async () => {
        active++
        maxObserved.push(active)
        await sleep(100)
        active--
        return id
      })

    const tasks = [1, 2, 3, 4, 5].map(makeTask)
    const results = await Promise.all(tasks)

    expect(results).toEqual([1, 2, 3, 4, 5])
    expect(Math.max(...maxObserved)).toBeLessThanOrEqual(2)
  })
})
