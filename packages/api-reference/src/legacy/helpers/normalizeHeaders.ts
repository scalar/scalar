import type { Header } from '@scalar/types/legacy'

import { normalizeHeaderName } from './normalizeHeaderName'

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
      uniqueHeaders.set(normalizeHeaderName(header.name), header)
    })

    return Array.from(uniqueHeaders.values()).map((header) => ({
      ...header,
      name: normalizeHeaderName(header.name),
    }))
  }

  // Key value object of headers
  return Object.fromEntries(
    Object.entries(headers ?? {})
      .reverse() // Reverse to keep the last occurrence
      .filter(
        ([key], index, arr) =>
          arr.findIndex(
            ([k]) => normalizeHeaderName(k) === normalizeHeaderName(key),
          ) === index,
      )
      .reverse() // Reverse back to maintain original order
      .map(([key, value]) => [normalizeHeaderName(key), value]),
  )
}
