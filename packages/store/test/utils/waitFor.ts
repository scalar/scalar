/**
 * Asynchronously waits for a condition to become true, or throws after maxTries.
 * Waits for a short delay between tries.
 */
export async function waitFor(
  /**
   * Function that returns true when the wait should stop
   */
  condition: () => boolean,
  /**
   * Maximum number of iterations to try (default: 100_000)
   */
  maxTries = 100_000,
  /**
   * Delay in milliseconds between tries (default: 1)
   */
  delayMs = 1,
): Promise<void> {
  let tries = 0
  while (!condition() && tries < maxTries) {
    tries++
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  if (tries === maxTries) {
    throw new Error('waitFor: Condition not met in time')
  }
}
