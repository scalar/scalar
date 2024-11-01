/**
 * Pass an URL or a relative URL and get an absolute URL
 */
export const makeUrlAbsolute = (url?: string) => {
  if (
    !url ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    typeof window === 'undefined'
  )
    return url

  const baseUrl = window.location.href

  // Remove any query parameters or hash from the base URL
  const cleanBaseUrl = baseUrl.split('?')[0].split('#')[0]

  // For base URLs with a path component, we want to remove the last path segment
  // if it doesn't end with a slash
  const normalizedBaseUrl = cleanBaseUrl.endsWith('/')
    ? cleanBaseUrl
    : cleanBaseUrl.substring(0, cleanBaseUrl.lastIndexOf('/') + 1)

  return new URL(url, normalizedBaseUrl).toString()
}
