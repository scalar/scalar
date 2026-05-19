/**
 * Type guard that narrows a `SchemaObject` to the variant where `type` is not
 * set.
 *
 * Untyped schemas are common in OpenAPI documents, for example when the
 * schema only uses compositional keywords like `allOf`, `oneOf`, `anyOf`,
 * `not`, or `enum` without an explicit `type`.
 *
 * `ReferenceObject` values (objects with a string `$ref`) and arrays are not
 * untyped schemas and are explicitly rejected, so this guard is safe to use
 * when walking a `SchemaObject | ReferenceObject` union. To narrow away
 * references first, reach for `isDereferenced`.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isUntypedSchema = <T>(
  schema: T,
): schema is [Extract<T, { type?: undefined; $ref?: undefined }>] extends [never]
  ? T & { type?: undefined; $ref?: undefined }
  : Extract<T, { type?: undefined; $ref?: undefined }> =>
  typeof schema === 'object' &&
  schema !== null &&
  !Array.isArray(schema) &&
  (schema as { type?: unknown }).type === undefined &&
  typeof (schema as { $ref?: unknown }).$ref !== 'string'
