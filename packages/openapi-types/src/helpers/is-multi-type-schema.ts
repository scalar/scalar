/**
 * Type guard that narrows a `SchemaObject` to the variant whose `type` is an
 * array of primitive types (e.g. `type: ['string', 'null']`).
 *
 * Multi-type schemas were introduced in OpenAPI 3.1 (JSON Schema 2020-12).
 * In OpenAPI 3.0, `type` is always a single string.
 *
 * Works with `SchemaObject` types from OpenAPI 3.1 and 3.2.
 */
export const isMultiTypeSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: readonly string[] }>] extends [never]
  ? T & { type: string[] }
  : Extract<T, { type: readonly string[] }> =>
  typeof schema === 'object' && schema !== null && Array.isArray((schema as { type?: unknown }).type)
