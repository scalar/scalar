/**
 * Type guard that narrows a `SchemaObject` to the variants whose `type` is
 * either `'number'` or `'integer'`.
 *
 * Numeric schemas share the same validation keywords (`multipleOf`,
 * `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`), so a single
 * guard is often more convenient than checking both types separately.
 *
 * Works with `SchemaObject` types from OpenAPI 2.0, 3.0, 3.1, and 3.2.
 */
export const isNumericSchema = <T>(
  schema: T,
): schema is [Extract<T, { type: 'number' | 'integer' }>] extends [never]
  ? T & { type: 'number' | 'integer' }
  : Extract<T, { type: 'number' | 'integer' }> => {
  if (typeof schema !== 'object' || schema === null) {
    return false
  }
  const type = (schema as { type?: unknown }).type
  return type === 'number' || type === 'integer'
}
