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
