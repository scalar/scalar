import { formatHeaderKey } from './normalize-headers'

/**
 * Normalize headers
 *
 * @deprecated this method is deprecated, move to the new one from './normalize-headers.ts'
 */
export function normalizeHeaders(
  headers: Response['headers'],
): Response['headers'] {
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
