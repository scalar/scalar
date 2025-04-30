/**
 * Sleeps for a given number of milliseconds
 *
 * @example
 * ```ts
 * await sleep(1000)
 * ```
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
