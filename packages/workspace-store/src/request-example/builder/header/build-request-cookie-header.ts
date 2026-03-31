import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

import { filterGlobalCookie } from './filter-global-cookies'

const CUSTOM_COOKIE_HEADER_WARNING =
  "We're using a `X-Scalar-Cookie` custom header to the request. The proxy will forward this as a `Cookie` header. We do this to avoid the browser omitting the `Cookie` header for cross-origin requests for security reasons."
const COOKIE_HEADER_WARNING = `We're trying to add a Cookie header, but browsers often omit them for cross-origin requests for various security reasons. If it's not working, that's probably why. Here are the requirements for it to work:

        - The browser URL must be on the same domain as the server URL.
        - The connection must be made over HTTPS.
        `

/**
 * Generate a cookie header from the cookie params
 */
export const getCookieHeader = (cookieParams: XScalarCookie[], originalCookieHeader: string | undefined): string => {
  // Generate the cookie header from the cookie params
  const cookieHeader = cookieParams.map((c) => `${c.name}=${c.value}`).join('; ')

  // Merge with the original cookie header
  if (originalCookieHeader && cookieHeader) {
    return `${originalCookieHeader}; ${cookieHeader}`
  }

  // Return whichever one exists, or empty string if both are empty
  return originalCookieHeader || cookieHeader || ''
}

/**
 * Build out the cookies header taking in global, param and security scheme cookies
 */
export const buildRequestCookieHeader = ({
  cookies,
  originalCookieHeader,
  url,
  useCustomCookieHeader,
}: {
  /** Parsed/replaced cookies from the parameters and security schemes */
  cookies: XScalarCookie[]
  /** Cookie header that previously exists from the spec OR from the user */
  originalCookieHeader: string | undefined | null
  /** The url of the request used to filter global cookies by domain */
  url: string
  /**
   * If we are running in Electron or using the proxy, we need to add a custom header
   * that's then forwarded as a `Cookie` header.
   */
  useCustomCookieHeader: boolean
}): null | { name: string; value: string } => {
  /** Filter the global cookies by domain + parse */

  /** Generate the cookie header */
  const cookieHeader = getCookieHeader(
    cookies.filter((cookie) => filterGlobalCookie({ url, cookie, disabledGlobalCookies: {} })),
    originalCookieHeader ?? undefined,
  )

  if (cookieHeader) {
    // Add a custom header for the proxy (that's then forwarded as `Cookie`)
    if (useCustomCookieHeader) {
      console.warn(CUSTOM_COOKIE_HEADER_WARNING)
      return { name: 'X-Scalar-Cookie', value: cookieHeader }
    }

    // or stick to the original header (which might be removed by the browser)
    console.warn(COOKIE_HEADER_WARNING)
    return { name: 'Cookie', value: cookieHeader }
  }

  return null
}
