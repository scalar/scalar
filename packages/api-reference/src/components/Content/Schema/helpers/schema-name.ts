import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getRefName, getSchemaRefName } from './get-ref-name'

type SchemaModelName = {
  /**
   * The key in `components.schemas` (extracted from `$ref`), used for sidebar
   * navigation. Only set when the `$ref` actually targets
   * `#/components/schemas/`; `null` for refs into other component buckets or
   * external files, so those never render a dead link.
   */
  schemaKey: string | null
  /** The human-readable name to display (schema.title, schema.name, or ref key). */
  label: string
}

/**
 * Extract schema name from various schema formats
 *
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export const getModelNameFromSchema = (
  schemaOrRef: SchemaObject | SchemaReferenceType<SchemaObject>,
): SchemaModelName | null => {
  if (!schemaOrRef) {
    return null
  }

  const schema = resolve.schema(schemaOrRef)

  // Only refs into `#/components/schemas/` are navigable in the models section.
  const schemaKey = '$ref' in schemaOrRef ? getSchemaRefName(schemaOrRef.$ref) : null

  if (schema.title) {
    return { schemaKey, label: schema.title }
  }

  if (schema.name) {
    return { schemaKey, label: schema.name }
  }

  if ('$ref' in schemaOrRef) {
    // Fall back to the last ref segment as a display label, even for
    // non-schema refs. The name still shows, it just is not a link.
    const label = getRefName(schemaOrRef.$ref)
    if (label) {
      return { schemaKey, label }
    }
  }

  return null
}

/**
 * Model name for a schema, resolving array branches too: an inline
 * `{ type: 'array', items: { $ref: Model } }` becomes `Model[]` instead of the
 * structural `array object[]`. Returns `null` when no model name applies (for
 * example an array of primitives), so callers can fall back to `getSchemaType`.
 */
export const getModelNameWithArray = (
  schemaOrRef: SchemaObject | SchemaReferenceType<SchemaObject>,
): SchemaModelName | null => {
  const direct = getModelNameFromSchema(schemaOrRef)
  if (direct) {
    return direct
  }

  const schema = resolve.schema(schemaOrRef)
  if (isArraySchema(schema) && schema.items) {
    const itemName = getModelNameFromSchema(schema.items)
    if (itemName) {
      return { schemaKey: itemName.schemaKey, label: `${itemName.label}[]` }
    }
  }

  return null
}
