/**
 * Detect requests to localhost
 */
export function isLocalUrl(url: string) {
  const { hostname } = new URL(url)
  const listOfLocalUrls = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']
  return listOfLocalUrls.includes(hostname)
}
