/**
 * Checks if a string is a remote URL (starts with http:// or https://)
 * @param value - The URL string to check
 * @returns true if the string is a remote URL, false otherwise
 * @example
 * ```ts
 * isHttpUrl('https://example.com/schema.json') // true
 * isHttpUrl('http://api.example.com/schemas/user.json') // true
 * isHttpUrl('#/components/schemas/User') // false
 * isHttpUrl('./local-schema.json') // false
 * ```
 */
export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
