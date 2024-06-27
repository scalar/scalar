/** Redirects the request to a proxy server with a given URL. */
export function redirectToProxy(proxy: string, url: string): string {
  // Skip relative URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  // Create new URL object from url
  const newUrl = new URL(url)

  // Rewrite the URL with the proxy
  newUrl.href = proxy

  // Add the original URL as a query parameter
  newUrl.searchParams.append('scalar_url', url)

  return newUrl.toString()
}
