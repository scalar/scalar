import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

import { matchesDomain } from './matches-domain'

/**
 * RFC 6265 path-match: cookie-path C matches request-path R when they are the same,
 * or C is a prefix of R and the next character is a slash. A trailing slash on C
 * already supplies that boundary, so `/api` matches `/api/users` but not `/apiv2`.
 */
const pathMatches = (requestPath: string, cookiePath: string): boolean => {
  if (requestPath === cookiePath || cookiePath.endsWith('/')) {
    return requestPath.startsWith(cookiePath)
  }

  return requestPath.startsWith(`${cookiePath}/`)
}

/**
 * Filter a global cookie to determine if it should be included with a request to the given URL.
 * - Returns false if the cookie is disabled, in the disabledGlobalCookies map, or missing a name.
 * - Returns false if the domain does not match.
 * - Returns false if the path is specified and the request pathname does not path-match it.
 * - Returns true otherwise.
 */
export const filterGlobalCookie = ({
  cookie,
  url,
  disabledGlobalCookies,
}: {
  cookie: XScalarCookie
  url: string
  disabledGlobalCookies: Record<string, boolean>
}): boolean => {
  // Filter out disabled cookies, those disabled globally, or those missing a name.
  if (cookie.isDisabled || disabledGlobalCookies[cookie.name.toLowerCase()] === true || !cookie.name) {
    return false
  }

  // Parse the URL to extract the pathname for path matching.
  const urlObject = new URL(url, 'https://example.com')

  // If a domain restriction exists, ensure the cookie is only sent for matching domains.
  if (cookie.domain && !matchesDomain(url, cookie.domain)) {
    return false
  }

  // An empty path means no path restriction. Otherwise require an RFC 6265 path-match,
  // so a cookie for `/api` is not sent to `/apiv2`.
  if (cookie.path && !pathMatches(urlObject.pathname, cookie.path)) {
    return false
  }

  // Cookie passed all checks; include it in the request.
  return true
}
