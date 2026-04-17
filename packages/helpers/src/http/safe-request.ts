import type { HttpMethod } from './http-methods'

/**
 * Sentinel header used to ferry GET/HEAD requests with bodies past the Fetch
 * spec restriction enforced by `new Request()` and `fetch()`. The receiving
 * side (for example, the Electron fetch shim) strips this header and reverts
 * the method back to the original before dispatching the underlying request.
 */
export const X_SCALAR_ORIGINAL_METHOD = 'x-scalar-original-method'

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD'])
const hasBody = (body: BodyInit | null | undefined): boolean => body !== null && body !== undefined

/**
 * Drop-in replacement for `new Request()` that transparently routes
 * GET/HEAD-with-body around the Fetch spec restriction.
 *
 * When the caller asks for a GET or HEAD request with a non-null body, the
 * underlying `Request` is constructed as a POST and the original method is
 * preserved in the {@link X_SCALAR_ORIGINAL_METHOD} header. Use
 * {@link getOriginalMethod} on the receiving side to recover the user-facing
 * method.
 *
 * In every other case this behaves exactly like `new Request()`.
 */
export const createSafeRequest = (input: RequestInfo | URL, init: RequestInit = {}): Request => {
  const method = (init.method ?? 'GET').toUpperCase()

  // For get/head with body
  if (METHODS_WITHOUT_BODY.has(method) && hasBody(init.body)) {
    const headers = new Headers(init.headers)
    headers.set(X_SCALAR_ORIGINAL_METHOD, method)
    return new Request(input, { ...init, method: 'POST', headers })
  }

  return new Request(input, { ...init, method })
}

/**
 * Returns the user-facing HTTP method for a request, honoring the
 * {@link X_SCALAR_ORIGINAL_METHOD} sentinel header when present.
 *
 * Pair this with {@link createSafeRequest} so consumers see the method the
 * caller actually intended, even when the underlying `Request` was rewritten
 * to satisfy the Fetch spec.
 */
export const getOriginalMethod = (request: Request): HttpMethod =>
  (request.headers.get(X_SCALAR_ORIGINAL_METHOD) ?? request.method).toLowerCase() as HttpMethod
