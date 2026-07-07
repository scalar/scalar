import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { parseSetCookie } from 'set-cookie-parser'

/**
 * A single change to apply to the persisted document cookie jar in response to a
 * server's `Set-Cookie` headers. This mirrors how a browser stores server-set
 * cookies so that values like a Django CSRF token survive a page reload and get
 * replayed on the next request.
 */
type ResponseCookieAction =
  | {
      type: 'upsert'
      /** The cookie fields to store. Merged over the existing cookie when `index` is set. */
      cookie: Pick<XScalarCookie, 'name' | 'value' | 'domain' | 'path'>
      /** Index of the existing cookie to update, or undefined to add a new one. */
      index?: number
    }
  | {
      type: 'delete'
      cookieName: string
      /** Index of the existing cookie to remove. */
      index: number
    }

/**
 * Resolve the real target URL a request was sent to, so cookies are scoped to
 * the API host rather than the proxy. When a request is proxied, the target URL
 * is carried in the `scalar_url` query parameter; otherwise the URL is used as-is.
 */
export const getCookieRequestUrl = (payloadUrl: string): string => {
  try {
    return new URL(payloadUrl).searchParams.get('scalar_url') ?? payloadUrl
  } catch {
    return payloadUrl
  }
}

/**
 * Compute the default cookie path from a request pathname, following the browser
 * default-path algorithm (RFC 6265, section 5.1.4): the request path up to, but
 * not including, its rightmost slash — or "/" when there is nothing before it.
 */
const getDefaultPath = (pathname: string): string => {
  if (!pathname.startsWith('/')) {
    return '/'
  }

  const lastSlash = pathname.lastIndexOf('/')

  return lastSlash <= 0 ? '/' : pathname.slice(0, lastSlash)
}

/**
 * Derive the host and default path a cookie should be scoped to from the request
 * URL. The URL is parsed defensively: `getCookieRequestUrl` may hand back a value
 * that is not a valid URL (for example a malformed `scalar_url`), and a throw here
 * would otherwise abort persistence after an otherwise successful request.
 */
const getRequestScope = (requestUrl: string): { hostname: string; defaultPath: string } => {
  try {
    const { hostname, pathname } = new URL(requestUrl, 'https://example.com')

    return { hostname, defaultPath: getDefaultPath(pathname) }
  } catch {
    return { hostname: '', defaultPath: '/' }
  }
}

/** Two stored cookies share an identity when name, domain, and path all match. */
const isSameCookie = (a: Pick<XScalarCookie, 'name' | 'domain' | 'path'>, b: XScalarCookie): boolean =>
  a.name === b.name && (a.domain ?? '') === (b.domain ?? '') && (a.path ?? '') === (b.path ?? '')

/**
 * Translate a response's `Set-Cookie` headers into a list of changes for the
 * document cookie jar.
 *
 * Scalar sends requests through a proxy and reads `Set-Cookie` from a custom
 * header because browsers hide it from `fetch`, so it has to maintain its own
 * cookie jar instead of relying on the browser. This function is that jar's
 * write path: it decides which cookies to add, update, or remove.
 *
 * Cookies are scoped like a browser would scope them — using the `Set-Cookie`
 * `Domain`/`Path` attributes, or falling back to the request host and default
 * path — so they are only replayed on matching requests. Expired cookies (an
 * `Expires` in the past or a non-positive `Max-Age`) remove the matching cookie,
 * matching how a server deletes a cookie.
 *
 * @param cookieHeaderKeys - Serialized `Set-Cookie` values from the response
 * @param documentCookies - The current persisted document cookies (order matches the store)
 * @param requestUrl - The request URL, used to derive the default domain and path
 * @param now - Current time in ms, injectable for testing
 */
export const getResponseCookieActions = ({
  cookieHeaderKeys,
  documentCookies,
  requestUrl,
  now = Date.now(),
}: {
  cookieHeaderKeys: string[]
  documentCookies: XScalarCookie[]
  requestUrl: string
  now?: number
}): ResponseCookieAction[] => {
  const { hostname, defaultPath } = getRequestScope(requestUrl)

  /**
   * Collapse the response's `Set-Cookie` headers into one final state per cookie
   * identity. A browser applies them in order, so a later header for the same
   * name/domain/path wins — whether it sets a new value or expires the cookie.
   * Resolving this first also keeps a single action per identity, so the same
   * stored cookie never gets a conflicting upsert and delete on the same index.
   */
  const resolved = new Map<
    string,
    { cookie: Pick<XScalarCookie, 'name' | 'value' | 'domain' | 'path'>; expired: boolean }
  >()

  for (const header of cookieHeaderKeys) {
    // Each header holds a single Set-Cookie value, so take the first parsed cookie.
    const [parsed] = parseSetCookie(header)

    if (!parsed?.name) {
      continue
    }

    // Scope the cookie the way a browser would, so it is only replayed on matching requests.
    const domain = parsed.domain || hostname
    const path = parsed.path || defaultPath

    // A cookie is deleted when it is already expired via Expires or Max-Age.
    const expired =
      (parsed.maxAge !== undefined && parsed.maxAge <= 0) ||
      (parsed.expires instanceof Date && parsed.expires.getTime() <= now)

    resolved.set(`${parsed.name}\n${domain}\n${path}`, {
      cookie: { name: parsed.name, value: parsed.value, domain, path },
      expired,
    })
  }

  const upserts: ResponseCookieAction[] = []
  const deletes: ResponseCookieAction[] = []

  for (const { cookie, expired } of resolved.values()) {
    const index = documentCookies.findIndex((existing) => isSameCookie(cookie, existing))

    if (expired) {
      if (index !== -1) {
        deletes.push({ type: 'delete', cookieName: cookie.name, index })
      }
      continue
    }

    upserts.push({
      type: 'upsert',
      cookie,
      ...(index === -1 ? {} : { index }),
    })
  }

  /**
   * Apply index-based changes (updates and deletes) before appends, and process
   * deletes from the highest index down, so earlier indices stay valid as the
   * underlying array shrinks.
   */
  const indexed = [...upserts.filter((action) => action.index !== undefined), ...deletes].sort(
    (a, b) => (b.index ?? 0) - (a.index ?? 0),
  )
  const appends = upserts.filter((action) => action.index === undefined)

  return [...indexed, ...appends]
}
