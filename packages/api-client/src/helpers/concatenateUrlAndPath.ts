/**
 * Make sure the URL and path are concatenated correctly.
 */
export const concatenateUrlAndPath = (url: string, path?: string) => {
  if (typeof path !== 'string' || !path.length) {
    return url
  }

  const urlWithSlash = url.endsWith('/') ? url : `${url}/`
  const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path

  return [urlWithSlash, pathWithoutSlash].join('')
}
