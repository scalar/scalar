import type { Header } from '@/legacy/types'

/**
 * Transforms all header keys to lowercase
 *
 * { 'Content-Type': 'application/json' } -> { 'content-type': 'application/json' }
 */
export const normalizeHeaders = (
  headers?: Record<string, any> | Header[],
): Record<string, any> | Header[] => {
  // Arrays of headers
  if (Array.isArray(headers)) {
    const uniqueHeaders = new Map<string, Header>()
    headers.forEach((header) => {
      uniqueHeaders.set(transformHeaderName(header.name), header)
    })

    return Array.from(uniqueHeaders.values()).map((header) => ({
      ...header,
      name: transformHeaderName(header.name),
    }))
  }

  // Key value object of headers
  return Object.fromEntries(
    Object.entries(headers ?? {})
      .reverse() // Reverse to keep the last occurrence
      .filter(
        ([key, _], index, arr) =>
          arr.findIndex(
            ([k, __]) => transformHeaderName(k) === transformHeaderName(key),
          ) === index,
      )
      .reverse() // Reverse back to maintain original order
      .map(([key, value]) => [transformHeaderName(key), value]),
  )
}

/**
 * Make the first letter and all letters after a dash uppercase
 */
function transformHeaderName(name: string) {
  // Split the header name by hyphens
  return (
    name
      .split('-')
      // Capitalize the first letter of each part
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      // Join the parts back together with hyphens
      .join('-')
  )
}
