/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'object'`.
 *
 * After narrowing, object-specific properties such as `properties`,
 * `required`, `additionalProperties`, `patternProperties`, and `propertyNames`
 * become accessible without a manual cast.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isObjectSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'object' }>] extends [never]
  ? T & { type: 'object' }
  : Extract<T, { type: 'object' }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === 'object'
