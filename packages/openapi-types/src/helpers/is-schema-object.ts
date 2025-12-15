import type { OpenAPIV3_1 } from '../openapi-types'

/**
 * Type guard to check if a value is a SchemaObject (an object, not a boolean).
 * In OpenAPI 3.1+, SchemaObject can be a boolean (true/false) or an object.
 * - true = empty schema that allows any instance to validate (accepts anything)
 * - false = schema that allows no instance to validate (rejects everything)
 *
 * This function accepts `unknown` to allow type checking on values that may not
 * be typed as SchemaObject yet (e.g., results from getResolvedRef).
 */
export const isSchemaObject = (schema: unknown): schema is Exclude<OpenAPIV3_1.SchemaObject, boolean> => {
  return typeof schema === 'object' && schema !== null
}
