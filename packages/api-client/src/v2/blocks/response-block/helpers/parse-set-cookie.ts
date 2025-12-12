/**
 * Parse a Set-Cookie header value into name and value.
 *
 * Set-Cookie headers have the format: name=value; attribute1; attribute2=value2
 * We extract just the cookie name and value (the part before the first semicolon).
 *
 * @param setCookieValue - The full Set-Cookie header value
 * @returns Object with cookie name and value, or null if parsing fails
 *
 * @example
 * parseSetCookie('sessionId=abc123; Path=/; HttpOnly')
 * // Returns: { name: 'sessionId', value: 'abc123; Path=/; HttpOnly' }
 */
export const parseSetCookie = (setCookieValue: string): { name: string; value: string } | null => {
  if (!setCookieValue || typeof setCookieValue !== 'string') {
    return null
  }

  // Find the first equals sign to split name from value
  const firstEqualsIndex = setCookieValue.indexOf('=')

  if (firstEqualsIndex === -1) {
    // Invalid cookie format (no equals sign)
    return null
  }

  const name = setCookieValue.substring(0, firstEqualsIndex).trim()
  // Keep everything after the equals sign as the value (including attributes)
  const value = setCookieValue.substring(firstEqualsIndex + 1).trim()

  if (!name) {
    // Cookie name cannot be empty
    return null
  }

  return { name, value }
}
