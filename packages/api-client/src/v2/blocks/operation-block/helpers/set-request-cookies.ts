import { replaceTemplateVariables } from '@/libs/string-template'
import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { shouldUseProxy } from '@scalar/oas-utils/helpers'

/**
 * The %x2F ("/") character is considered a directory separator, and subdirectories match as well.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
const defaultPath = '/'

/**
 * Set all cookie params and workspace level cookies that are applicable
 */
export function setRequestCookies({
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
} {
  const cookieParams: Cookie[] = []

  const isUsingTheProxy = shouldUseProxy(proxyUrl, serverUrl)

  // Try to add the target domain with a wildcard dot
  const defaultDomain = determineCookieDomain(
    isUsingTheProxy ? (proxyUrl as string) : (serverUrl ?? 'http://localhost'),
  )

  // Add global cookies that match the current domain
  globalCookies.forEach((c) => {
    const { name, value, domain: configuredHostname, ...params } = c
    if (!matchesDomain(serverUrl, configuredHostname) || !name) {
      return
    }

    cookieParams.push(
      cookieSchema.parse({
        name,
        value,
        domain: configuredHostname,
        path: params.path,
      }),
    )
  })

  // Add local cookies
  example.parameters.cookies.forEach((c) => {
    if (!c.enabled || !c.key) {
      return
    }

    cookieParams.push(
      cookieSchema.parse({
        name: c.key,
        value: replaceTemplateVariables(c.value, env),
        domain: defaultDomain,
        path: defaultPath,
      }),
    )
  })

  return {
    cookieParams,
  }
}

/**
 * If the Set-Cookie header does not specify a Domain attribute, the cookies are available on the server that sets it
 * but not on its subdomains. Therefore, specifying Domain is less restrictive than omitting it.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
const determineCookieDomain = (url: string) => {
  const hostname = new URL(url.startsWith('http') ? url : `http://${url}`).hostname

  // If it's an IP, just return it
  if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return hostname
  }

  // If it's IPv6, just return it
  if (hostname.match(/^[a-fA-F0-9:]+$/)) {
    return hostname
  }

  // If it's a hostname, return it with a dot
  return hostname.startsWith('.') ? hostname : `.${hostname}`
}

/**
 * Matches, when:
 * - Isn't scoped to a domain, or
 * - matches the current host, or
 * - or ends with the current host, or
 * - matches the current host with a wildcard.
 */
export const matchesDomain = (givenUrl?: string, configuredHostname?: string): boolean => {
  if (!givenUrl || !configuredHostname) {
    return true
  }

  try {
    // Add protocol if not present
    const urlWithProtocol = givenUrl.startsWith('http') ? givenUrl : `http://${givenUrl}`

    // Get just the hostname
    const givenHostname = new URL(urlWithProtocol).hostname

    // Let's see if the configured hostname matches the given hostname in some way
    const noHostnameConfigured = !configuredHostname
    const hostnameMatches = configuredHostname === givenHostname
    const domainMatchesWildcard = configuredHostname.startsWith('.') && configuredHostname === `.${givenHostname}`
    const subdomainMatchesWildcard = configuredHostname.startsWith('.') && givenHostname?.endsWith(configuredHostname)

    return noHostnameConfigured || hostnameMatches || subdomainMatchesWildcard || domainMatchesWildcard
  } catch {
    return false
  }
}

/**
 * Generate a cookie header from the cookie params
 */
export const getCookieHeader = (cookieParams: Cookie[], originalCookieHeader?: string): string => {
  // Generate the cookie header from the cookie params
  const cookieHeader = cookieParams.map((c) => `${c.name}=${c.value}`).join('; ')

  // Merge with the original cookie header
  if (originalCookieHeader) {
    return `${originalCookieHeader}; ${cookieHeader}`.trim()
  }

  return cookieHeader.trim()
}
