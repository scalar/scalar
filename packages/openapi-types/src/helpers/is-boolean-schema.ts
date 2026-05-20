/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'boolean'`.
 *
 * Note: this checks the OpenAPI/JSON Schema `type` keyword (i.e. a schema
 * that validates boolean values). It is different from `isBooleanJsonSchema`,
 * which checks whether the schema itself is the literal `true` or `false`.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isBooleanSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'boolean' }>] extends [never]
  ? T & { type: 'boolean' }
  : Extract<T, { type: 'boolean' }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === 'boolean'
