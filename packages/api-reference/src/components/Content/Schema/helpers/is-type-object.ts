import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/*
 * Checks whether a JSON schema is of type object
 */
export const isTypeObject = (schema: unknown): schema is OpenAPIV3_1.SchemaObject => {
  // null, primitive types, arrays
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    return false
  }

  const hasType = 'type' in schema
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
