/**
 * Checks if the given string is a valid URL
 */
export function isValidUrl(url: string) {
  try {
    return Boolean(new URL(url))
  } catch {
    return false
  }
}
