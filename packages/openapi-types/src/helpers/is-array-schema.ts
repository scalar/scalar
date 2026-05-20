/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'array'`.
 *
 * After narrowing, array-specific properties such as `items`, `prefixItems`,
 * `minItems`, `maxItems`, and `uniqueItems` become accessible without a
 * manual cast.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isArraySchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'array' }>] extends [never] ? T & { type: 'array' } : Extract<T, { type: 'array' }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === 'array'
