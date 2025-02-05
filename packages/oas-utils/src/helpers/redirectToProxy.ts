import { REGEX } from '@/helpers/regexHelpers'

import { isLocalUrl } from './isLocalUrl'

/** Redirects the request to a proxy server with a given URL. */
export function redirectToProxy(proxy?: string, url?: string): string {
  if (!shouldUseProxy(proxy, url)) {
    return url ?? ''
  }

  // Create new URL object from url
  const newUrl = new URL(url as string)

  // Rewrite the URL with the proxy
  newUrl.href = proxy as string

  // Add the original URL as a query parameter
  newUrl.searchParams.append('scalar_url', url as string)

  return newUrl.toString()
}

/** Check if the URL is relative or if it's a domain without protocol */
export const isRelativePath = (url: string) => {
  // Absolute URLs start with http:// or https://
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false
  }

  // Allow other protocols such as file://
  if (REGEX.PROTOCOL.test(url)) {
    return false
  }

  // Check if it looks like a domain (contains dots and no spaces)
  // This catches cases like "galaxy.scalar.com/planets"
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/|$)/.test(url)) {
    return false
  }

  return true
}

/** Returns false for requests to localhost, relative URLs, if no proxy is defined … */
export function shouldUseProxy(proxy?: string, url?: string): boolean {
  // No proxy or url
  if (!proxy || !url) return false

  // Relative URLs
  if (isRelativePath(url)) return false

  // Requests to localhost
  if (isLocalUrl(url)) return false

  return true
}
