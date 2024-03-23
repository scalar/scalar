/**
 * Normalizes a URL by trimming it and adding http:// as the default prefix.
 */
export const normalizeUrl = (url?: string) => {
  if (typeof url !== 'string') {
    console.warn(
      `[sendRequest] URL is not a string. Using an empty string as the default.`,
    )

    return ''
  }

  let sanitizedUrl = url

  if (!sanitizedUrl.startsWith('http')) {
    console.warn(
      `[sendRequest] URL does not start with http. Adding http:// as the default prefix.`,
    )

    sanitizedUrl = `http://${sanitizedUrl}`
  }

  const urlObject = new URL(sanitizedUrl)
  // we only want to lowercase the hostname, and not the path
  urlObject.hostname = urlObject.hostname.trim().toLowerCase()

  return urlObject.toString()
}
