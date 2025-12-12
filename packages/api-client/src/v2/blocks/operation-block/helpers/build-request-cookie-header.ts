import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

import { determineCookieDomain } from '@/libs/send-request/set-request-cookies'

/**
 * Generate a cookie header from the cookie params
 */
export const getCookieHeader = (cookieParams: XScalarCookie[], originalCookieHeader: string | undefined): string => {
  // Generate the cookie header from the cookie params
  const cookieHeader = cookieParams.map((c) => `${c.name}=${c.value}`).join('; ')

  // Merge with the original cookie header
  if (originalCookieHeader) {
    return `${originalCookieHeader}; ${cookieHeader}`.trim()
  }

  return cookieHeader.trim()
}

/**
 * Build out the cookies header taking in global, param and security scheme cookies
 */
export const buildRequestCookieHeader = ({
  paramCookies,
  globalCookies,
  env,
  originalCookieHeader,
  domainUrl,
  useCustomCookieHeader,
}: {
  /** Parsed/replaced cookies from the parameters and security schemes */
  paramCookies: XScalarCookie[]
  /** Raw global cookies from the workspace/document */
  globalCookies: XScalarCookie[]
  /** Environment variables flattened into a key-value object */
  env: Record<string, string>
  /** Cookie header that previously exists from the spec OR from the user */
  originalCookieHeader: string | undefined
  /** The domain used to filter global cookies */
  domainUrl: string
  /**
   * If we are running in Electron or using the proxy, we need to add a custom header
   * that's then forwarded as a `Cookie` header.
   */
  useCustomCookieHeader: boolean
}): null | { name: string; value: string } => {
  /** Try to add the target domain with a wildcard dot */
  const defaultDomain = determineCookieDomain(domainUrl)

  const filteredGlobalCookies = globalCookies.filter((c) => !c.isDisabled)
  const cookieHeader = getCookieHeader([...paramCookies, ...filteredGlobalCookies], originalCookieHeader)

  if (cookieHeader) {
    // Add a custom header for the proxy (that's then forwarded as `Cookie`)
    if (useCustomCookieHeader) {
      console.warn(
        "We're using a `X-Scalar-Cookie` custom header to the request. The proxy will forward this as a `Cookie` header. We do this to avoid the browser omitting the `Cookie` header for cross-origin requests for security reasons.",
      )

      return { name: 'X-Scalar-Cookie', value: cookieHeader }
    }

    // or stick to the original header (which might be removed by the browser)
    console.warn(
      `We're trying to add a Cookie header, but browsers often omit them for cross-origin requests for various security reasons. If it's not working, that's probably why. Here are the requirements for it to work:

        - The browser URL must be on the same domain as the server URL.
        - The connection must be made over HTTPS.
        `,
    )

    return { name: 'Cookie', value: cookieHeader }
  }

  return null
}
