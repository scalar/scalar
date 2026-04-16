import { parseMimeType } from '@scalar/helpers/http/mime-type'

/**
 * Browser fetch uses text/plain;charset=UTF-8 as the default body type
 * when the response does not include a Content-Type header.
 */
export const DEFAULT_RESPONSE_CONTENT_TYPE = 'text/plain;charset=UTF-8'

/**
 * Resolve the response content type with a consistent fallback.
 */
export const resolveResponseContentType = (contentType: string | null | undefined): string =>
  contentType ?? DEFAULT_RESPONSE_CONTENT_TYPE

/**
 * Parse the effective response MIME type using the fallback content type.
 */
export const resolveResponseMimeType = (contentType: string | null | undefined) =>
  parseMimeType(resolveResponseContentType(contentType))
