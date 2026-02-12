import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getRefName } from './get-ref-name'

/**
 * Extract schema name from various schema formats
 *
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export const getModelNameFromSchema = (
  schemaOrRef: SchemaObject | SchemaReferenceType<SchemaObject>,
): string | null => {
  if (!schemaOrRef) {
    return null
  }

  if ('$ref' in schemaOrRef) {
    // Grab the name of the schema from the ref path
    const refName = getRefName(schemaOrRef.$ref)
    if (refName) {
      return refName
    }
  }

  const schema = resolve.schema(schemaOrRef)

  // Direct title/name properties - use direct property access for better performance
  if (schema.title) {
    return schema.title
  }

  if (schema.name) {
    return schema.name
  }

  return null
}
