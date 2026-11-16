import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'

import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

/** Whether generation interprets contentSchema as an unencoded JSON string payload. */
export const hasUnencodedJsonContent = (schema: SchemaObject): boolean => {
  if (!('contentSchema' in schema) || !isJsonMediaType(schema.contentMediaType)) return false
  if ('contentEncoding' in schema) return false
  return (
    !('type' in schema) || schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string'))
  )
}
