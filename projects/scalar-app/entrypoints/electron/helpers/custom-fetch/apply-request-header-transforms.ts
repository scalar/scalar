import {
  X_SCALAR_COOKIE,
  X_SCALAR_DATE,
  X_SCALAR_DNT,
  X_SCALAR_REFERER,
  X_SCALAR_USER_AGENT,
} from '@scalar/helpers/http/scalar-headers'

type RequestHeaderTransform = {
  scalarHeader: string
  targetHeader: string
}

const REQUEST_HEADER_TRANSFORMS: RequestHeaderTransform[] = [
  { scalarHeader: X_SCALAR_COOKIE, targetHeader: 'Cookie' },
  { scalarHeader: X_SCALAR_USER_AGENT, targetHeader: 'User-Agent' },
  { scalarHeader: X_SCALAR_DATE, targetHeader: 'Date' },
  { scalarHeader: X_SCALAR_DNT, targetHeader: 'DNT' },
  { scalarHeader: X_SCALAR_REFERER, targetHeader: 'Referer' },
]

/**
 * Apply the scalar header transforms before the request is sent:
 * - `x-scalar-cookie` → promoted to `Cookie` then removed
 * - `x-scalar-user-agent` → promoted to `User-Agent` then removed
 * - `x-scalar-date` → promoted to `Date` then removed
 * - `x-scalar-dnt` → promoted to `DNT` then removed
 * - `x-scalar-referer` → promoted to `Referer` then removed
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

  REQUEST_HEADER_TRANSFORMS.forEach(({ scalarHeader, targetHeader }) => {
    const headerValue = h.get(scalarHeader)
    h.delete(scalarHeader)
    if (headerValue) {
      h.set(targetHeader, headerValue)
    }
  })

  return Object.fromEntries(h.entries())
}
