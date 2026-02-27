import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
/**
 * Filter a global cookie to determine if it should be included with a request to the given URL.
 * - Returns false if the cookie is disabled, in the disabledGlobalCookies map, or missing a name.
 * - Returns false if the domain does not match.
 * - Returns false if the path is specified and does not match the URL pathname.
 * - Returns true otherwise.
 */
export declare const filterGlobalCookie: ({
  cookie,
  url,
  disabledGlobalCookies,
}: {
  cookie: XScalarCookie
  url: string
  disabledGlobalCookies: Record<string, boolean>
}) => boolean
//# sourceMappingURL=filter-global-cookies.d.ts.map
