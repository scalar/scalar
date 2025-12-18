import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

/**
 * Determines if the given schema is an empty object schema.
 * An empty object schema is defined as a schema with type 'object'
 * and no defined properties.
 */
export const isEmptySchemaObject = (schema: SchemaObject | undefined): boolean => {
  if (!isTypeObject(schema)) {
    return false
  }

  return Object.keys(schema.properties ?? {}).length === 0
}
