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
 *
 * @example
 * extractServer('google.com/v1/users')
 * // Returns: ['google.com', '/v1/users']
 */
export const extractServerFromPath = (path = ''): [string, string] | null => {
  if (!path.trim()) {
    return null
  }

  /**
   * Handle bare-hostname URLs without a protocol (e.g., "google.com/path").
   * Only treat the input as a server when the candidate host contains a dot,
   * so plain path-only inputs like "api/v1/users" stay paths.
   *
   * The protocol check is scoped to the start of the string so that inputs
   * like "api.example.com/auth?redirect=https://app.com/cb" are still treated
   * as bare hostnames rather than being skipped because of a "://" inside the
   * query string, path, or fragment.
   */
  if (!path.startsWith('/') && !/^[a-z][a-z0-9+\-.]*:\/\//i.test(path)) {
    const hostEnd = path.search(/[/?#]/)
    const host = hostEnd === -1 ? path : path.slice(0, hostEnd)

    if (host.includes('.')) {
      try {
        const url = new URL(`https://${path}`)
        if (url.origin === 'null') {
          return null
        }
        /**
         * Preserve any explicit port from the input. The URL API strips the
         * default port for the parsing scheme (443 for https), which would
         * otherwise lose information the user explicitly provided. Since the
         * actual protocol is unknown for bare hostnames, we must not apply
         * protocol-dependent port normalization.
         */
        let origin = url.host
        const explicitPortMatch = host.match(/:(\d+)$/)
        if (explicitPortMatch && !url.port) {
          origin = `${url.hostname}:${explicitPortMatch[1]}`
        }
        const remainingPath = decodeURIComponent(url.pathname) + url.search + url.hash
        return [origin, remainingPath]
      } catch {
        return null
      }
    }
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
