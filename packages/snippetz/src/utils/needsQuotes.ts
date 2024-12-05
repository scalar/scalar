/**
 * Checks if a key needs to be wrapped in quotes when used as an object property
 *
 * Returns true if the key contains spaces or hyphens
 */
export function needsQuotes(key: string) {
  return /\s|-/.test(key)
}
