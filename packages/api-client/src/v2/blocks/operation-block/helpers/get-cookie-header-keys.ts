/**
 * Safely extract cookie header keys from response headers.
 * Modern browsers support getSetCookie() which returns an array of Set-Cookie values.
 *
 * @param headers - The response headers object
 * @returns Array of cookie header keys or empty array if not supported
 */
export const getCookieHeaderKeys = (headers: Headers): string[] => {
  return 'getSetCookie' in headers && typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : []
}
