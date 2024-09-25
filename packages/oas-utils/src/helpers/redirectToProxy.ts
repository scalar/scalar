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

/** Check if the URL is relative, aka doesn't start with http[s] */
export const isRelativePath = (url: string) => !/^https?:\/\//.test(url)

/** Returns false for requests to localhost, relative URLs, if no proxy is defined … */
export function shouldUseProxy(proxy?: string, url?: string): boolean {
  // No proxy or url
  if (!proxy || !url) return false

  // Relative URLs
  if (isRelativePath(url)) return false

  // Requests to localhost
  // if (isRequestToLocalhost(url)) return false

  return true
}

/** Detect requests to localhost */
export function isRequestToLocalhost(url: string) {
  const { hostname } = new URL(url)
  const listOfLocalUrls = ['localhost', '127.0.0.1', '[::1]']
  return listOfLocalUrls.includes(hostname)
}
