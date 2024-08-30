/**
 * Normalize headers:
 *
 * - Electron modifies the headers to allow CORS, this function hides the modifications
 * - Restores original headers
 * - Normalizes the header keys
 * - Sorts headers alphabetically
 *
 */
export function normalizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  /** Exact key of the modified headers header */
  const modifiedHeaderKey = Object.keys(headers).find(
    (key) => key.toLowerCase() === 'x-scalar-modified-headers',
  )

  /** List of modified headers */
  const modifiedHeaders = modifiedHeaderKey
    ? headers
        .get(modifiedHeaderKey)
        ?.toString()
        .split(', ')
        ?.map((value: string) => value.toLowerCase()) ?? []
    : []

  // Remove headers listed in `X-Scalar-Modified-Headers`
  Object.keys(headers).forEach((key) => {
    if (modifiedHeaders.includes(key.toLowerCase())) {
      headers.delete(key)
    }
  })

  // Remove `X-Scalar-Modified-Headers` header
  if (modifiedHeaderKey) {
    headers.delete(modifiedHeaderKey)
  }

  // Restore original headers (remove the `X-Scalar-Original-` prefix)
  Object.keys(headers).forEach((key) => {
    if (key.toLowerCase().startsWith('x-scalar-original-')) {
      const originalKey = key.replace('X-Scalar-Original-', '')
      headers.set(originalKey, headers.get(key) ?? '')
      headers.delete(key)
    }
  })

  // Normalizes the header keys
  Object.keys(headers).forEach((key) => {
    const formattedKey = formatHeaderKey(key)
    if (key !== formattedKey) {
      headers.set(formattedKey, headers.get(key) ?? '')
      headers.delete(key)
    }
  })

  // Sort headers alphabetically by key
  return headers
}

/** Make the first letter and all letters after a dash uppercase */
function formatHeaderKey(key: string) {
  return key
    .split('-')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    .join('-')
}
