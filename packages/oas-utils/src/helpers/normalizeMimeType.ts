import type { ContentType } from '../types'

/**
 * Normalizes a MIME type to a standard format.
 *
 * Input: application/problem+json; charset=utf-8
 * Output: application/json
 */
export function normalizeMimeType(contentType?: string) {
  if (typeof contentType !== 'string') {
    return undefined
  }

  return (
    contentType
      // Remove '; charset=utf-8'
      .replace(/;.*$/, '')
      // Remove 'problem+'
      .replace(/\/.+\+/, '/')
      // Remove whitespace
      .trim() as ContentType
  )
}
