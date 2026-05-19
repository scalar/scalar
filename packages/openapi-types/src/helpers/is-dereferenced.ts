/**
 * Type guard that returns `true` when `value` is not a `ReferenceObject`.
 *
 * A `ReferenceObject` is identified by the presence of a string `$ref`
 * property. Use this helper while walking a document that may still contain
 * references to narrow values down to their inline shape.
 *
 * Like the schema discriminators, this works with the `SchemaObject` and
 * `ReferenceObject` types from every supported OpenAPI version (2.0, 3.0,
 * 3.1, and 3.2). It removes the reference members from the union when they
 * can be told apart, and otherwise falls back to an intersection so callers
 * still get a usable narrowed type.
 *
 * @example
 * ```ts
 * const schema = components.schemas?.Pet
 *
 * if (isDereferenced(schema)) {
 *   // `schema` is the inline SchemaObject; `$ref` is ruled out.
 *   schema.type
 * }
 * ```
 */
export const isDereferenced = <T>(
  value: T,
): value is [Exclude<T, { $ref: string }>] extends [never] ? T & { $ref?: undefined } : Exclude<T, { $ref: string }> =>
  typeof value === 'object' && value !== null && typeof (value as { $ref?: unknown }).$ref !== 'string'
