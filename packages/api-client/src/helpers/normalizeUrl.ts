/**
 * Normalizes a URL by trimming it and adding http:// as the default prefix.
 */
export const normalizeUrl = (url?: string) => {
  // Force at least an empty string
  if (typeof url !== 'string') {
    console.warn(
      `[sendRequest] URL is not a string. Using an empty string as the default.`,
    )

    return ''
  }

  let sanitizedUrl = url

  // Force http:// as the default prefix
  if (!sanitizedUrl.startsWith('http')) {
    console.warn(
      `[sendRequest] URL does not start with http. Adding http:// as the default prefix.`,
    )

    sanitizedUrl = `http://${sanitizedUrl}`
  }

  // Remove whitespace
  return sanitizedUrl.trim()
}
