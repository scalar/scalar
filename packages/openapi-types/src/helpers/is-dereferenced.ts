import type { OpenAPIV3_1 } from '../openapi-types'

/**
 * Type guard that returns `true` when `obj` is not a `ReferenceObject`.
 *
 * A `ReferenceObject` is identified by the presence of a string `$ref`
 * property. Use this helper while walking a document that may still contain
 * references to narrow values down to their inline shape.
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
export const isDereferenced = <T>(obj: T | OpenAPIV3_1.ReferenceObject): obj is T =>
  typeof obj === 'object' &&
  obj !== null &&
  !('$ref' in obj && typeof (obj as OpenAPIV3_1.ReferenceObject).$ref === 'string')
