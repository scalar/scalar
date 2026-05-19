/**
 * Type guard that narrows a `SchemaObject` to the variant where `type` is not
 * set.
 *
 * Untyped schemas are common in OpenAPI documents, for example when the
 * schema only uses compositional keywords like `allOf`, `oneOf`, `anyOf`,
 * `not`, `$ref`, or `enum` without an explicit `type`.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isUntypedSchema = <T>(
  schema: T,
): schema is [Extract<T, { type?: undefined }>] extends [never]
  ? T & { type?: undefined }
  : Extract<T, { type?: undefined }> =>
  typeof schema === 'object' && schema !== null && (schema as { type?: unknown }).type === undefined
