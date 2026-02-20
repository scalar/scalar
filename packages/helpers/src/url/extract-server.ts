/**
 * Extracts the server from a string, used to check for servers in paths during migration
 *
 * @param path - The URL string to parse. If no protocol is provided, the URL API will throw an error.
 * @returns The origin (e.g., "https://example.com:8080") or null if the input is empty, whitespace-only, or invalid.
 *
 * @example
 * extractServer('https://api.example.com/v1/users?id=123')
 * // Returns: 'https://api.example.com'
 *
 * @example
 * extractServer('/users')
 * // Returns: null
 *
 * @example
 * extractServer('//api.example.com/v1/users')
 * // Returns: '//api.example.com'
 */
export const extractServer = (path = ''): string | null => {
  if (!path.trim()) {
    return null
  }

  /**
   * Handle protocol-relative URLs (e.g., "//api.example.com")
   * These URLs inherit the protocol from the current page context.
   * We preserve them as-is without adding a protocol.
   */
  if (path.startsWith('//')) {
    try {
      /**
       * Use a dummy protocol to parse the URL, then reconstruct without it.
       * This allows us to validate the URL structure and extract the origin.
       */
      const url = new URL(`https:${path}`)
      if (url.origin === 'null') {
        return null
      }
      /**
       * Return the protocol-relative origin by removing the protocol.
       * This preserves the original format while ensuring it is valid.
       */
      return url.origin.replace(/^https?:/, '')
    } catch {
      return null
    }
  }

  try {
    const url = new URL(path)
    /**
     * The URL API returns the string "null" for certain protocols (like file://)
     * and for URLs with ports but no protocol. We treat this as invalid.
     */
    return url.origin === 'null' ? null : url.origin
  } catch {
    return null
  }
}
