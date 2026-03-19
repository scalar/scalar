import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

/**
 * Checks if a given URL's hostname matches a configured domain pattern.
 * Supports exact hostname matching and wildcard subdomain matching (e.g., ".example.com").
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
