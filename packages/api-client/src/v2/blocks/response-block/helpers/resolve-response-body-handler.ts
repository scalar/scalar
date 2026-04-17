import type { ClientPlugin, ResponseBodyHandler } from '@scalar/oas-utils/helpers'

/**
 * Find the first plugin response body handler that matches a given MIME type.
 * Plugins are checked in order — first match wins, allowing users to override native behavior.
 *
 * Matching supports:
 * - Exact match: "application/msgpack"
 * - Suffix wildcard: "application/vnd.*+json" matches "application/vnd.api+json"
 */
export const resolveResponseBodyHandler = (
  mimeType: string,
  plugins: ClientPlugin[],
): ResponseBodyHandler | undefined => {
  for (const plugin of plugins) {
    if (!plugin.responseBody) {
      continue
    }

    for (const handler of plugin.responseBody) {
      if (matchesMimeType(mimeType, handler.mimeTypes)) {
        return handler
      }
    }
  }

  return undefined
}

/**
 * Checks if the given MIME type matches any of the provided MIME type patterns.
 * Supports both exact match (e.g. "application/json") and wildcard patterns (e.g. "application/*", "application/vnd.*+json").
 *
 * Example:
 *   matchesMimeType('application/json', ['application/*'])           // true
 *   matchesMimeType('application/vnd.api+json', ['application/vnd.*+json']) // true
 *   matchesMimeType('text/plain', ['application/json'])              // false
 *
 * @param actual - The MIME type to match (e.g., "application/json")
 * @param patterns - List of patterns that may include wildcards (e.g., ["application/*", "text/*"])
 * @returns true if actual matches any pattern; false otherwise
 */
const matchesMimeType = (actual: string, patterns: string[]): boolean => {
  const normalized = actual.toLowerCase()

  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase()

    // Exact match: "application/json" === "application/json"
    if (normalizedPattern === normalized) {
      return true
    }

    // Wildcard match: "application/*" or "application/vnd.*+json"
    if (normalizedPattern.includes('*')) {
      // Escape regex special chars except for *
      const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
      const regex = new RegExp(`^${escaped}$`)
      if (regex.test(normalized)) {
        return true
      }
    }
  }

  return false
}
