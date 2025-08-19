/**
 * Measures the execution time of a function and logs it.
 *
 * Works only with sync functions and returns the result of the measured function.
 *
 * @example
 *
 * ```ts
 * // Sync function
 * const result = measureSync('computation', () => {
 *   return heavyComputation()
 * })
 * ```
 */
export const measureSync = <T>(name: string, fn: () => T): T => {
  const start = performance.now()

  const result = fn()

  const end = performance.now()
  const duration = Math.round(end - start)

  console.info(`${name}: ${duration} ms`)

  return result
}

/**
 * Measures the execution time of an async function and logs it.
 *
 * Works only with async functions and returns the result of the measured function.
 *
 * @example
 *
 * ```ts
 * // Async function
 * const result = await measure('api-call', async () => {
 *   return await fetchData()
 * })
 * ````
 */
export const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now()

  const result = await fn()

  const end = performance.now()
  const duration = Math.round(end - start)

  console.info(`${name}: ${duration} ms`)

  return result
}
