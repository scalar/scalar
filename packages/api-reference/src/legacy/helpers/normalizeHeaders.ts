/**
 * Transforms all header keys to lowercase
 *
 * { 'Content-Type': 'application/json' } -> { 'content-type': 'application/json' }
 */
export const normalizeHeaders = (headers?: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(headers ?? {})
      // Lowercase all keys
      .map(([key, value]) => [key.toLowerCase(), value]),
  )
