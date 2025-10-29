/**
 * Options for configuring the debounce behavior.
 */
export type DebounceOptions = {
  /** The delay in milliseconds before executing the function. Defaults to 100ms. */
  delay?: number
  /** Custom separator for joining key parts. Defaults to a null byte to prevent collisions. */
  separator?: string
}

/**
 * Creates a debounced function executor that delays execution until after a specified time.
 * Multiple calls with the same key will cancel previous pending executions.
 *
 * This is useful for batching rapid updates (like auto-save or API calls) to avoid
 * unnecessary processing or network requests.
 *
 * @param options - Configuration options for delay and key separator
 * @returns A function that accepts a key array and callback to execute
 *
 * @example
 * const debouncedSave = debounce({ delay: 500 })
 * debouncedSave(['user', '123'], () => saveUser(user))
 */
export const debounce = (options: DebounceOptions = {}) => {
  const { delay = 100, separator = '\0' } = options
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * Cleanup function to clear all pending timeouts.
   * Call this when you need to cancel all pending operations (e.g., component unmount).
   */
  const cleanup = (): void => {
    for (const timeout of timeouts.values()) {
      clearTimeout(timeout)
    }
    timeouts.clear()
  }

  /**
   * Schedules a function to run after the configured delay.
   * If called again with the same key before the delay expires, the previous call is cancelled.
   *
   * @param key - Array of strings to uniquely identify this operation
   * @param fn - The function to execute after the delay
   */
  const execute = (key: readonly string[], fn: () => unknown | Promise<unknown>): void => {
    // Add the length of the key to the composite key to prevent collisions
    const compositeKey = `${key.join(separator)}-${key.length}`

    // Cancel any existing timeout for this key
    const existingTimeout = timeouts.get(compositeKey)
    if (existingTimeout !== undefined) {
      clearTimeout(existingTimeout)
    }

    // Schedule the new timeout
    const timeout = setTimeout(() => {
      try {
        // biome-ignore lint/nursery/noFloatingPromises: No need to await for the result, fire and forget
        fn()
      } catch {
        // do not throw if the function throws
      } finally {
        // Always clean up the timeout reference, even if fn throws
        timeouts.delete(compositeKey)
      }
    }, delay)

    timeouts.set(compositeKey, timeout)
  }

  return { execute, cleanup }
}
