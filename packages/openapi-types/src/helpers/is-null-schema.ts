/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is
 * `'null'`.
 *
 * The `'null'` type was introduced in OpenAPI 3.1 (aligning with JSON Schema
 * 2020-12). In OpenAPI 3.0, nullability is expressed via `nullable: true`,
 * not via `type: 'null'`.
 *
 * Works with `SchemaObject` types from OpenAPI 3.1 and 3.2.
 */
export const isNullSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'null' }>] extends [never] ? T & { type: 'null' } : Extract<T, { type: 'null' }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === 'null'
