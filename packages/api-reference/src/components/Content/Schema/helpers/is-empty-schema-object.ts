import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Determines if the given schema is an empty object schema.
 * An empty object schema is defined as a schema with type 'object'
 * and no defined properties.
 */
export const isEmptySchemaObject = (schema: SchemaObject | undefined): boolean => {
  if (typeof schema !== 'object' || !schema) {
    return false
  }

  return 'type' in schema && schema.type === 'object' && Object.keys(schema.properties ?? {}).length === 0
}
