/**
 * Formats a duration in milliseconds as a human-readable string.
 * - Durations less than 1000ms are shown in milliseconds with no decimals.
 * - Durations 1000ms and greater are shown in seconds with two decimal places.
 *
 * @example
 * formatDuration(580) // '580ms'
 * formatDuration(1337) // '1.34s'
 * formatDuration(2000) // '2.00s'
 *
 * @param ms - The duration in milliseconds
 * @returns The formatted duration string (e.g., '350ms', '2.15s')
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
