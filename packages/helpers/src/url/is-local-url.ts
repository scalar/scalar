/** Obviously local hostnames */
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

/** Reserved TLDs that are guaranteed to never be assigned */
const RESERVED_TLDS = ['test', 'example', 'invalid', 'localhost']

/**
 * Detect requests to localhost or reserved TLDs
 */
export function isLocalUrl(url: string) {
  try {
    const { hostname } = new URL(url)

    // Check if hostname is in the local hostnames list
    if (LOCAL_HOSTNAMES.includes(hostname)) {
      return true
    }

    // Check if hostname ends with a reserved TLD
    const tld = hostname.split('.').pop()
    if (tld && RESERVED_TLDS.includes(tld)) {
      return true
    }

    return false
  } catch {
    // If it's not a valid URL, we can't use the proxy anyway,
    // but it also covers cases like relative URLs (e.g. `openapi.json`).
    return true
  }
}
