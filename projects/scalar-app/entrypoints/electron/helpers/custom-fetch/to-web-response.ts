import { NULL_BODY_STATUSES } from './null-body-statuses'
import type { TransportResponse } from './types'

/**
 * Build a DOM `Response` from a `TransportResponse` received over Electron IPC
 * or from a local/streaming transport.
 *
 * `Response.url` and `Response.redirected` are read-only properties set by the
 * browser's native fetch; they are always `""` / `false` on manually-constructed
 * responses.  We use a Proxy to surface the values returned by the main process
 * so that consumers (e.g. `new URL(response.url)`) work correctly.
 *
 * Passing `target` — not `receiver` — to `Reflect.get` is intentional: native
 * getters on `Response` (e.g. `body`, `bodyUsed`) require `this` to be the
 * real `Response` instance; using the Proxy as `receiver` causes "Illegal
 * invocation".
 */
export const toWebResponse = (result: TransportResponse): Response => {
  const headers = new Headers()
  for (const [key, value] of result.headers) {
    headers.append(key, value)
  }

  // Per the Fetch spec, null-body statuses (101, 204, 205, 304) must have a
  // null body.  Passing any non-null value to the Response constructor for
  // these statuses throws a TypeError, so we force null regardless of what
  // the transport returned.
  const body = NULL_BODY_STATUSES.has(result.status) ? null : result.body

  const response = new Response(body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  })
  return new Proxy(response, {
    get(target, prop) {
      if (prop === 'url') {
        return result.url
      }
      if (prop === 'redirected') {
        return result.redirected
      }
      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
