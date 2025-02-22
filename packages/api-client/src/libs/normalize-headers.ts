/**
 * Normalize headers:
 *
 * - Electron modifies the headers to allow CORS, this function hides the modifications
 * - Restores original headers
 * - Normalizes the header keys
 * - Sorts headers alphabetically
 * - converts to an object
 *
 */
export const normalizeHeaders = (_headers: Headers, removeProxyHeaders = false): Record<string, string> => {
  // Convert headers to an object
  const headers = Object.fromEntries(_headers)

  // Remove headers, that are added by the proxy
  if (removeProxyHeaders) {
    const headersToRemove = [
      'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Origin',
      'Access-Control-Expose-Headers',
    ]

    headersToRemove.map((header) => header.toLowerCase()).forEach((header) => delete headers[header])
  }

  /** Exact key of the modified headers header */
  const modifiedHeaderKey = Object.keys(headers).find((key) => key.toLowerCase() === 'x-scalar-modified-headers')

  /** List of modified headers */
  const modifiedHeaders = modifiedHeaderKey
    ? (headers[modifiedHeaderKey]
        ?.toString()
        .split(', ')
        ?.map((value: string) => value.toLowerCase()) ?? [])
    : []

  // Remove headers listed in `X-Scalar-Modified-Headers`
  Object.keys(headers).forEach((key) => {
    if (modifiedHeaders.includes(key.toLowerCase())) {
      delete headers[key]
    }
  })

  // Remove `X-Scalar-Modified-Headers` header
  if (modifiedHeaderKey) {
    delete headers[modifiedHeaderKey]
  }

  // Restore original headers (remove the `X-Scalar-Original-` prefix)
  Object.keys(headers).forEach((key) => {
    // Case-insensitive regular expression
    const ORIGINAL_KEY_REGEX = /^x-scalar-original-/i

    if (ORIGINAL_KEY_REGEX.test(key)) {
      const originalKey = key.replace(ORIGINAL_KEY_REGEX, '')
      if (headers[key]) {
        headers[originalKey] = headers[key]
        delete headers[key]
      }
    }
  })

  // Normalizes the header keys
  Object.keys(headers).forEach((key) => {
    const formattedKey = formatHeaderKey(key)
    if (key !== formattedKey && headers[key]) {
      headers[formattedKey] = headers[key]
      delete headers[key]
    }
  })

  // Sort headers alphebetically by key
  return Object.fromEntries(Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)))
}

/** Make the first letter and all letters after a dash uppercase */
export const formatHeaderKey = (key: string) =>
  key
    .split('-')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    .join('-')
