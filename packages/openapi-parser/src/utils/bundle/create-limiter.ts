/**
 * Creates a function that limits the number of concurrent executions of async functions.
 *
 * @param maxConcurrent - Maximum number of concurrent executions allowed
 * @returns A function that wraps async functions to limit their concurrent execution
 *
 * @example
 * ```ts
 * const limiter = createLimiter(2) // Allow max 2 concurrent executions
 *
 * // These will run with max 2 at a time
 * const results = await Promise.all([
 *   limiter(() => fetch('/api/1')),
 *   limiter(() => fetch('/api/2')),
 *   limiter(() => fetch('/api/3')),
 *   limiter(() => fetch('/api/4'))
 * ])
 * ```
 */
export function createLimiter(maxConcurrent: number) {
  let activeCount = 0
  const queue: (() => void)[] = []

  const next = () => {
    if (queue.length === 0 || activeCount >= maxConcurrent) {
      return
    }

    const resolve = queue.shift()

    if (resolve) {
      resolve()
    }
  }

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeCount >= maxConcurrent) {
      await new Promise<void>((resolve) => queue.push(resolve))
    }

    activeCount++
    try {
      const result = await fn()
      return result
    } finally {
      activeCount--
      next()
    }
  }

  return run
}
