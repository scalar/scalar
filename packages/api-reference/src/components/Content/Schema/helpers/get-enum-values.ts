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
  return (
    value.enum ||
    (isArraySchema(value) && typeof value.items === 'object' && 'enum' in value.items ? value.items.enum : []) ||
    []
  )
}
