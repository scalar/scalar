/** Function overload for createApiReference to allow multiple different signatures */
export type Measure = {
  <T>(name: string, fn: () => T): T
  <T>(name: string, fn: () => Promise<T>): Promise<T>
  <T>(name: string, fn: () => T | Promise<T>): T | Promise<T>
}

/**
 * Measures the execution time of a function and logs it.
 * Works with both async and sync functions.
 * Returns the result of the measured function.
 *
 * @example
 * ```ts
 * // Async function
 * const result = await measure('api-call', async () => {
 *   return await fetchData()
 * })
 *
 * // Sync function
 * const result = measure('computation', () => {
 *   return heavyComputation()
 * })
 * ```
 */
export const measure: Measure = (name, fn) => {
  const start = performance.now()

  const result = fn()

  const end = performance.now()
  const duration = Math.round(end - start)

  console.info(`${name}: ${duration} ms`)

  return result
}
