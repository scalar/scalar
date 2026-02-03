import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/**
 * Extract enum values from schema or array items
 *
 * @param value - The schema object to extract enum values from
 * @returns Array of enum values, or empty array if no enum found
 */
export const getEnumValues = (value: SchemaObject | undefined): unknown[] => {
  if (!value) {
    return []
  }

  // Check for enum directly on the schema
  if (value.enum) {
    return value.enum
  }

  // Check for enum in array items (resolving $ref if present)
  if (isArraySchema(value) && typeof value.items === 'object') {
    const resolvedItems = resolve.schema(value.items)
    if (resolvedItems && 'enum' in resolvedItems && resolvedItems.enum) {
      return resolvedItems.enum
    }
  }

  return []
}
