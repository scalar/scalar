/**
 * Type guard that checks whether a value is a boolean JSON Schema.
 *
 * In JSON Schema (and therefore OpenAPI 3.1+), a schema can be the literal
 * `true` (matches any value) or `false` (matches no value), used in place of
 * an object schema. This is different from `isBooleanSchema`, which checks
 * for an object schema with `type: 'boolean'`.
 *
 * Note: the strict `SchemaObject` types in `@scalar/openapi-types/3.0`,
 * `/3.1`, and `/3.2` do not include `boolean` in the union, but boolean
 * schemas are legal where `SchemaObject | ReferenceObject | boolean` is
 * accepted (for example inside `properties` or `additionalProperties`).
 */
export const isBooleanJsonSchema = (schema: unknown): schema is boolean => typeof schema === 'boolean'
