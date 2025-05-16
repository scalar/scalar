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
export function measure<T>(name: string, fn: () => Promise<T>): Promise<T>
export function measure<T>(name: string, fn: () => T): T
export function measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
  const start = performance.now()

  const result = fn()

  const end = performance.now()
  const duration = Math.round(end - start)

  console.log(`${name}: ${duration} ms`)

  return result
}
