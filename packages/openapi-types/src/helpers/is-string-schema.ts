/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'string'`.
 *
 * After narrowing, string-specific properties such as `minLength`,
 * `maxLength`, `pattern`, `contentMediaType`, and `contentEncoding` become
 * accessible without a manual cast.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isStringSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'string' }>] extends [never]
  ? T & { type: 'string' }
  : Extract<T, { type: 'string' }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === 'string'
