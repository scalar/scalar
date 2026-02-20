/**
 * Extracts the server from a string, used to check for servers in paths during migration
 *
 * @param path - The URL string to parse. If no protocol is provided, the URL API will throw an error.
 * @returns A tuple of [origin, remainingPath] or null if the input is empty, whitespace-only, or invalid.
 *
 * @example
 * extractServer('https://api.example.com/v1/users?id=123')
 * // Returns: ['https://api.example.com', '/v1/users?id=123']
 *
 * @example
 * extractServer('/users')
 * // Returns: null
 *
 * @example
 * extractServer('/users')
 * // Returns: null
 *
 * @example
 * extractServer('//api.example.com/v1/users')
 * // Returns: ['//api.example.com', '/v1/users']
 */
export const extractServerFromPath = (path = ''): [string, string] | null => {
  if (!path.trim()) {
    return null
  }

  /** Handle protocol-relative URLs (e.g., "//api.example.com") */
  if (path.startsWith('//')) {
    try {
      /** Use dummy protocol to parse, then strip it */
      const url = new URL(`https:${path}`)
      if (url.origin === 'null') {
        return null
      }
      const origin = url.origin.replace(/^https?:/, '')

      /** Decode pathname to preserve OpenAPI template variables like {userId} */
      const remainingPath = decodeURIComponent(url.pathname) + url.search + url.hash
      return [origin, remainingPath]
    } catch {
      return null
    }
  }

  try {
    const url = new URL(path)
    /** URL API returns "null" for file:// and other invalid protocols */
    if (url.origin === 'null') {
      return null
    }
    /** Decode pathname to preserve OpenAPI template variables like {userId} */
    const remainingPath = decodeURIComponent(url.pathname) + url.search + url.hash
    return [url.origin, remainingPath]
  } catch {
    return null
  }
}
