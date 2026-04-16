import type { ClientPlugin, ResponseBodyHandler } from '@scalar/oas-utils/helpers'

/**
 * Find the first plugin response body handler that matches a given MIME type.
 * Plugins are checked in order — first match wins, allowing users to override native behavior.
 *
 * Matching supports:
 * - Exact match: "application/msgpack"
 * - Suffix wildcard: "application/vnd.*+json" matches "application/vnd.api+json"
 */
export function resolveResponseBodyHandler(
  mimeType: string,
  plugins: ClientPlugin[],
): ResponseBodyHandler | undefined {
  for (const plugin of plugins) {
    if (!plugin.responseBody) continue

    for (const handler of plugin.responseBody) {
      if (matchesMimeType(mimeType, handler.mimeTypes)) {
        return handler
      }
    }
  }

  return undefined
}

function matchesMimeType(actual: string, patterns: string[]): boolean {
  const normalized = actual.toLowerCase()

  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase()

    if (normalizedPattern === normalized) {
      return true
    }

    // Wildcard matching: "application/*" matches "application/json"
    if (normalizedPattern.includes('*')) {
      const escaped = normalizedPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
      const regex = new RegExp(`^${escaped}$`)
      if (regex.test(normalized)) {
        return true
      }
    }
  }

  return false
}
