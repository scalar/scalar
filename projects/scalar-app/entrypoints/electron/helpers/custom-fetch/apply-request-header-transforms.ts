const X_SCALAR_COOKIE = 'x-scalar-cookie'
const X_SCALAR_USER_AGENT = 'x-scalar-user-agent'

/**
 * Apply the scalar header transforms before the request is sent:
 * - `x-scalar-cookie` → promoted to `Cookie` then removed
 * - `x-scalar-user-agent` → promoted to `User-Agent` then removed
 *
 * Shared between the renderer (applied inside `toIpcRequest` so every
 * transport receives normalized headers) and the main process (applied at the
 * top of `handleCustomFetch` as a defense-in-depth pass — any caller that
 * bypasses the renderer, e.g. a future IPC path or a test harness, still
 * produces correctly-shaped outbound headers).
 *
 * The function uses `Headers` internally so lookups are case-insensitive,
 * which means `X-Scalar-Cookie` and `x-scalar-cookie` are treated identically.
 */
export const applyRequestHeaderTransforms = (headers: Record<string, string>): Record<string, string> => {
  const h = new Headers(headers)

  const cookie = h.get(X_SCALAR_COOKIE)
  h.delete(X_SCALAR_COOKIE)
  if (cookie) {
    h.set('Cookie', cookie)
  }

  const userAgent = h.get(X_SCALAR_USER_AGENT)
  h.delete(X_SCALAR_USER_AGENT)
  if (userAgent) {
    h.set('User-Agent', userAgent)
  }

  return Object.fromEntries(h.entries())
}
