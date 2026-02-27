import { type Cookie } from '@scalar/oas-utils/entities/cookie'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
/**
 * Set all cookie params and workspace level cookies that are applicable
 */
export declare function setRequestCookies({
  example,
  env,
  globalCookies,
  serverUrl,
  proxyUrl,
}: {
  example: RequestExample
  env: object
  globalCookies: Cookie[]
  serverUrl: string
  proxyUrl: string | undefined
}): {
  cookieParams: Cookie[]
}
/**
 * Matches, when:
 * - Isn't scoped to a domain, or
 * - matches the current host, or
 * - or ends with the current host, or
 * - matches the current host with a wildcard.
 */
export declare const matchesDomain: (givenUrl?: string, configuredHostname?: string) => boolean
/**
 * Generate a cookie header from the cookie params
 */
export declare const getCookieHeader: (cookieParams: Cookie[], originalCookieHeader?: string) => string
//# sourceMappingURL=set-request-cookies.d.ts.map
