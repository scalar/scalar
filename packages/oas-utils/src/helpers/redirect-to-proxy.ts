import { isLocalUrl } from './is-local-url.ts'
import { REGEX } from './regex-helpers.ts'

/**
 * Redirects the request to a proxy server with a given URL. But not for:
 *
 * - Relative URLs
 * - URLs that seem to point to a local IP
 * - URLs that don't look like a domain
 **/
export function redirectToProxy(proxy?: string, url?: string): string {
  try {
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
  } catch {
    return url ?? ''
  }
}

/**
 * Check if the URL is relative or if it's a domain without protocol
 **/
export const isRelativePath = (url: string) => {
  // Allow http:// https:// and other protocols such as file://
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

/**
 * Returns false for requests to localhost, relative URLs, if no proxy is defined …
 **/
export function shouldUseProxy(proxyUrl?: string, url?: string): boolean {
  try {
    // No proxy or url
    if (!proxyUrl || !url) {
      return false
    }

    // Relative URLs
    if (isRelativePath(url)) {
      return false
    }

    // Requests to localhost
    if (isLocalUrl(url)) {
      return false
    }

    return true
  } catch {
    return false
  }
}
