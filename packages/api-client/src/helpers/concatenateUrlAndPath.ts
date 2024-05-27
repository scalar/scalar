/**
 * Make sure the URL and path are concatenated correctly.
 */
export const concatenateUrlAndPath = (url: string, path?: string) => {
  if (typeof path !== 'string' || !path.length) {
    return url
  }

  const trimmedUrl = url.trim()
  const trimmedPath = path.trim()

  const urlWithSlash = trimmedUrl.endsWith('/') ? trimmedUrl : `${trimmedUrl}/`
  const pathWithoutSlash = trimmedPath.startsWith('/')
    ? trimmedPath.slice(1)
    : trimmedPath

  return [urlWithSlash, pathWithoutSlash].join('')
}
