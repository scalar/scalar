/** Redirects the request to a proxy server with a given URL. */
export function redirectToProxy(proxy: string, url: string): string {
  // Create new URL object from url
  const newUrl = new URL(url)

  // Rewrite the URL with the proxy
  newUrl.href = proxy

  // Add the original URL as a query parameter
  newUrl.searchParams.append('scalar_url', encodeURI(url))

  return newUrl.toString()
}
