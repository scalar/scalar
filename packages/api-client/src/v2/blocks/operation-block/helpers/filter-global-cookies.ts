import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

import { matchesDomain } from '@/libs/send-request/set-request-cookies'

/**
 * Filter a global cookie to determine if it should be included with a request to the given URL.
 * - Returns false if the cookie is disabled, in the disabledGlobalCookies map, or missing a name.
 * - Returns false if the domain does not match.
 * - Returns false if the path is specified and does not match the URL pathname.
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

  // If a path restriction exists, ensure the cookie is only sent for URLs with a matching prefix.
  if (cookie.path && !urlObject.pathname.startsWith(cookie.path)) {
    return false
  }

  // Cookie passed all checks; include it in the request.
  return true
}
