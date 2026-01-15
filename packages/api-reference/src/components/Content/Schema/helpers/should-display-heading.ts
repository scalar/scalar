import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Determine if property heading should be displayed
 *
 * @param schema - The schema object to check
 * @param name - Optional property name
 * @param required - Whether the property is required
 * @returns true if heading should be displayed, false otherwise
 */
export const shouldDisplayHeading = (schema: SchemaObject | undefined, name?: string, required = false): boolean => {
  // Early return for simple cases
  if (name || required) {
    return true
  }

  // If schema is undefined, return false
  if (!schema) {
    return false
  }

  // Check schema properties that warrant a heading
  return (
    schema.deprecated === true ||
    schema.const !== undefined ||
    schema.enum?.length === 1 ||
    ('type' in schema && schema.type !== undefined) ||
    ('nullable' in schema && schema.nullable === true) ||
    schema.writeOnly === true ||
    schema.readOnly === true
  )
}
