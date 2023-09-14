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

  let normalizedUrl = url.trim().toLowerCase()

  if (!normalizedUrl.startsWith('http')) {
    console.warn(
      `[sendRequest] URL does not start with http. Adding http:// as the default prefix.`,
    )

    normalizedUrl = `http://${normalizedUrl}`
  }

  return normalizedUrl
}
