import { X_SCALAR_MODIFIED_HEADERS, X_SCALAR_ORIGINAL_PREFIX } from '@/http/scalar-headers'

/**
 * Returns the response headers as the API sent them, before the Scalar proxy or the desktop app
 * changed them.
 *
 * Both replace some headers with their own values (for example a sandboxing
 * `Content-Security-Policy`) so the browser does not act on them. They list those headers in
 * `X-Scalar-Modified-Headers` and pass the upstream values on as `X-Scalar-Original-*`.
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
    if (key.startsWith(X_SCALAR_ORIGINAL_PREFIX) && value) {
      restored.set(key.slice(X_SCALAR_ORIGINAL_PREFIX.length), value)
    }
  })

  return restored
}
