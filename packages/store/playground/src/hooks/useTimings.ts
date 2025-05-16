import { reactive } from '@vue/reactivity'

/**
 * Composable for measuring and recording performance timings of async operations.
 * Provides a way to track execution time of async functions and store the results
 * in a reactive store.
 *
 * @example
 * ```ts
 * const { timings, measure } = useTimings()
 *
 * // Measure an async operation
 * await measure('fetch-data', async () => {
 *   const data = await fetch('/api/data')
 *   return data.json()
 * })
 *
 * // Access timings in template
 * // <Timings :timings="timings" />
 * ```
 */
export function useTimings() {
  /** Reactive store of timing measurements */
  const timings = reactive<Record<string, number>>({})

  /**
   * Records a timing measurement with a given name and duration.
   * Also logs the measurement to the console for debugging purposes.
   *
   * @param name - Identifier for this measurement
   * @param duration - Duration in milliseconds
   */
  function recordTiming(name: string, duration: number) {
    timings[name] = duration
    console.log(`${name}: ${duration}ms`)
  }

  /**
   * Measures the execution time of an async function and records it.
   * Returns the result of the measured function.
   *
   * @param name - Identifier for this measurement
   * @param fn - Async function to measure
   * @returns The result of the measured function
   *
   * @example
   * ```ts
   * const result = await measure('api-call', async () => {
   *   return await fetchData()
   * })
   * ```
   */
  async function measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = Math.round(end - start)

    recordTiming(name, duration)
    return result
  }

  return {
    /** Reactive store of all timing measurements */
    timings,
    /** Function to measure async operations */
    measure,
  }
}
