/**
 * Checks whether the given string is an URL
 **/
export function isUrl(input: string | null): boolean {
  // Quick check for null or undefined
  if (!input) {
    return false
  }

  // Trim whitespace
  const trimmed = input.trim()

  // If it's an URL, it must start with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }

  // But it must have more than just the protocol
  return trimmed.replace(/^https?:\/\//, '').length > 0
}
