/**
 * Pass an URL or a relative URL and get an absolute URL
 */
export function makeUrlAbsolute(url?: string) {
  if (!url) {
    return url
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  const baseUrl = window.location.href

  // Remove any query parameters or hash from the base URL
  const cleanBaseUrl = baseUrl.split('?')[0].split('#')[0]

  // Ensure the base URL ends with a slash if it doesn’t already
  const normalizedBaseUrl = cleanBaseUrl.endsWith('/')
    ? cleanBaseUrl
    : cleanBaseUrl + '/'

  return new URL(url, normalizedBaseUrl).toString()
}
