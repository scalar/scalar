/** Checks whether the given string could be an OpenAPI document */
export function isDocument(input: string | null): boolean {
  // Return false for null, undefined, empty strings, or whitespace-only strings
  if (!input || input.trim().length === 0) {
    return false
  }

  const trimmed = input.trim()

  // Return false if it looks like a URL (starts with http:// or https://)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return false
  }

  return true
}
