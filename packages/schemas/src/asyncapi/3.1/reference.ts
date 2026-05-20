import { isObject } from '@scalar/helpers/object/is-object'
import { type Schema, evaluate, intersection, object, string, union } from '@scalar/validation'

import { referenceExtensions } from '@/general/bunder-extensions'

/**
 * Wraps an inline schema so it may also be satisfied by an AsyncAPI Reference Object.
 *
 * Passed into every `create*` factory in this folder and into {@link generateSchema}.
 * Use `normalRef` for validation of raw documents, or `recursiveRef` when types should
 * include a resolved `$ref-value` alongside `$ref`.
 */
export type MaybeRefFn = (inner: Schema) => Schema

/**
 * AsyncAPI Reference Object (JSON Reference). Only `$ref` is defined; additional
 * properties SHALL be ignored per the specification.
 */
export const asyncApiReferenceObject = object(
  {
    '$ref': string({ typeComment: 'REQUIRED. The reference string.' }),
  },
  { typeName: 'AsyncApiReferenceObject', typeComment: 'JSON Reference for AsyncAPI components.' },
)

/**
 * Union of an inline schema and {@link asyncApiReferenceObject}.
 *
 * This is the default `maybeRef` implementation for `create*` factories that return a
 * **Reference union** (`T | Reference Object`).
 */
export const normalRef = (schema: Schema): Schema => union([schema, asyncApiReferenceObject])

const e = (value: unknown) => {
  if (isObject(value) && '$ref' in value) {
    return e(value['$ref-value'])
  }

  return value
}
/**
 * Like {@link normalRef}, but reference branches also carry `$ref-value` and bundle extensions.
 *
 * Use as `maybeRef` in {@link generateSchema} when generating types for resolved or proxy
 * documents, not for plain AsyncAPI files on disk.
 */
export const recursiveRef = (schema: Schema): Schema =>
  union([
    schema,
    intersection([asyncApiReferenceObject, object({ '$ref-value': evaluate(e, schema) }), referenceExtensions]),
  ])
