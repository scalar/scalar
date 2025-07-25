import type { ContentType } from '@scalar/types/legacy'

/**
 * Normalizes a MIME type to a standard format.
 *
 * Input: application/problem+json; charset=utf-8
 * Output: application/json
 */
export function normalizeMimeType(contentType: undefined): undefined
export function normalizeMimeType(contentType: string): ContentType
export function normalizeMimeType(contentType: string | undefined): ContentType | undefined {
  if (typeof contentType !== 'string') {
    return undefined
  }

  return (
    contentType
      // Remove '; charset=utf-8'
      .replace(/;.*$/, '')
      // Remove 'problem+' but keep vendor-specific vnd and fhir mime types
      .replace(/\/(?!.*vnd\.|fhir\+).*\+/, '/')
      // Remove whitespace
      .trim() as ContentType
  )
}
