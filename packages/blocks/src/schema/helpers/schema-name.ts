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
): {
  /** The key in components.schemas (extracted from $ref), used for sidebar navigation. */
  schemaKey: string | null
  /** The human-readable name to display (schema.title, schema.name, or ref key). */
  label: string
} | null => {
  if (!schemaOrRef) {
    return null
  }

  const schema = resolve.schema(schemaOrRef)

  const schemaKey = '$ref' in schemaOrRef ? (getRefName(schemaOrRef.$ref) ?? null) : null

  if (schema.title) {
    return { schemaKey, label: schema.title }
  }

  if (schema.name) {
    return { schemaKey, label: schema.name }
  }

  if ('$ref' in schemaOrRef) {
    if (schemaKey) {
      return { schemaKey, label: schemaKey }
    }
  }

  return null
}
