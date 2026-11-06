import { X_SCALAR_MODIFIED_HEADERS, X_SCALAR_ORIGINAL_PREFIX } from '@/http/scalar-headers'

/**
 * Returns the response headers as the API sent them, before the Scalar proxy changed them.
 *
 * The proxy replaces some headers with its own values (for example a sandboxing
 * `Content-Security-Policy`) so the browser does not act on them. It lists those headers in
 * `X-Scalar-Modified-Headers` and passes the upstream values on as `X-Scalar-Original-*`.
 *
 * Unlike `normalizeHeaders`, this keeps every other header untouched, including the key casing, so
 * it is safe to hand to scripts and tools that inspect the raw response.
 */
export const restoreOriginalHeaders = (headers: Headers): Headers => {
  const modifiedHeaders = new Set(
    (headers.get(X_SCALAR_MODIFIED_HEADERS) ?? '')
      .split(',')
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean),
  )

  const restored = new Headers()

  headers.forEach((value, key) => {
    if (key === X_SCALAR_MODIFIED_HEADERS || key.startsWith(X_SCALAR_ORIGINAL_PREFIX) || modifiedHeaders.has(key)) {
      return
    }

    restored.append(key, value)
  })

  // Upstream values win over anything else with the same name
  headers.forEach((value, key) => {
    const originalKey = key.slice(X_SCALAR_ORIGINAL_PREFIX.length)

    // A bare `X-Scalar-Original-` has no name to restore, and Headers throws on an empty name
    if (key.startsWith(X_SCALAR_ORIGINAL_PREFIX) && originalKey) {
      restored.set(originalKey, value)
    }
  })

  return restored
}
