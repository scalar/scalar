import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/*
 * Checks whether a JSON schema is of type object
 */
export const isTypeObject = (schema: unknown): schema is Extract<SchemaObject, { type: 'object' }> => {
  // null, primitive types, arrays
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    return false
  }

  // Check for composition keywords - if present, this should be handled by composition logic
  const hasComposition = 'oneOf' in schema || 'anyOf' in schema || 'allOf' in schema || 'not' in schema

  // If it has composition keywords, it should not be treated as a simple object schema
  if (hasComposition) {
    return false
  }

  const hasType = 'type' in schema

  // Handle union types (type: ['object', 'null'])
  if (hasType && Array.isArray(schema.type)) {
    return schema.type.includes('object')
  }

  const hasTypeObject = hasType && schema.type === 'object'

  // type: object
  if (hasTypeObject) {
    return true
  }

  // type: string, number, boolean, array, etc.
  if (hasType && !hasTypeObject) {
    return false
  }

  const hasProperties = 'properties' in schema
  const hasAdditionalProperties = 'additionalProperties' in schema
  const hasPatternProperties = 'patternProperties' in schema

  return hasProperties || hasAdditionalProperties || hasPatternProperties
}
