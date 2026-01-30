/**
 * Waits for a condition to be true with a timeout.
 * Checks the condition at a specified interval up to a maximum wait time.
 *
 * @param checkCondition - Function that returns true when the condition is met
 * @param options - Configuration options
 * @param options.checkInterval - Time in milliseconds between checks (default: 100)
 * @param options.maxWaitTime - Maximum time in milliseconds to wait (default: 3000)
 * @returns Promise that resolves to true if the condition is met, false if it timed out
 */
export const waitForCondition = (
  checkCondition: () => boolean,
  options: {
    checkInterval?: number
    maxWaitTime?: number
  } = {},
): Promise<boolean> => {
  const { checkInterval = 100, maxWaitTime = 3000 } = options

  return new Promise((resolve) => {
    if (checkCondition()) {
      resolve(true)
      return
    }

    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += checkInterval

      if (checkCondition()) {
        clearInterval(interval)
        resolve(true)
      } else if (elapsed >= maxWaitTime) {
        clearInterval(interval)
        resolve(false)
      }
    }, checkInterval)
  })
}
