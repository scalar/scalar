import { getObjectKeys, normalizeMimeTypeObject } from '@scalar/oas-utils/helpers'
import type { MediaTypeObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Checks if a media type object has any displayable content.
 * This includes having a schema, a single example, or multiple examples.
 *
 * Note: We use explicit property checks for `example` because falsy values
 * like `0`, `false`, and `""` are valid JSON examples that should be displayed.
 * We still treat `null` as "no content" since it explicitly indicates absence.
 */
function hasMediaTypeContent(mediaType: MediaTypeObject | undefined): boolean {
  if (!mediaType) {
    return false
  }

  const hasSchema = Boolean(mediaType.schema)
  const hasExample = 'example' in mediaType && mediaType.example !== null
  const hasExamples = Boolean(mediaType.examples)

  return hasSchema || hasExample || hasExamples
}

/**
 * Checks if a response object has body content (schema, example, or examples).
 * Looks through common media types in priority order.
 */
export function hasResponseContent(response: ResponseObject | undefined): boolean {
  const normalizedContent = normalizeMimeTypeObject(response?.content)
  const keys = getObjectKeys(normalizedContent ?? {})

  const mediaType =
    normalizedContent?.['application/json'] ??
    normalizedContent?.['application/xml'] ??
    normalizedContent?.['text/plain'] ??
    normalizedContent?.['text/html'] ??
    normalizedContent?.['*/*'] ??
    normalizedContent?.[keys[0] ?? '']

  return hasMediaTypeContent(mediaType)
}
