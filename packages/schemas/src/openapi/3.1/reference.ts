import { isObject } from '@scalar/helpers/object/is-object'
import { type Schema, evaluate, intersection, object, optional, string, union } from '@scalar/validation'

import { referenceExtensions } from '@/general/bundler-extensions'

/**
 * Wraps an inline schema so it may also be satisfied by an OpenAPI Reference Object.
 *
 * Passed into every `create*` factory in this folder and into {@link createOpenApiDocumentSchema}.
 * Use `normalRef` for validation of raw documents, or `recursiveRef` when types should
 * include a resolved `$ref-value` alongside `$ref`.
 */
export type MaybeRefFn = (inner: Schema) => Schema

export const openApiReferenceObject = object(
  {
    '$ref': string({ typeComment: 'REQUIRED. The reference identifier. This MUST be in the form of a URI.' }),
    summary: optional(
      string({
        typeComment:
          'A short summary which by default SHOULD override that of the referenced component. If the referenced object-type does not allow a summary field, then this field has no effect.',
      }),
    ),
    description: optional(
      string({
        typeComment:
          'A description which by default SHOULD override that of the referenced component. CommonMark syntax MAY be used for rich text representation. If the referenced object-type does not allow a description field, then this field has no effect.',
      }),
    ),
  },
  { typeName: 'ReferenceObject' },
)

/**
 * Union of an inline schema and {@link openApiReferenceObject}.
 *
 * This is the default `maybeRef` implementation for `create*` factories that return a
 * **Reference union** (`T | Reference Object`).
 */
export const normalRef = (schema: Schema): Schema => union([schema, openApiReferenceObject])

const e = (value: unknown) => {
  if (isObject(value) && '$ref' in value) {
    return e(value['$ref-value'])
  }

  return value
}

/**
 * Like {@link normalRef}, but reference branches also carry `$ref-value` and bundle extensions.
 *
 * Use as `maybeRef` in {@link createOpenApiDocumentSchema} when generating types for resolved or proxy
 * documents, not for plain OpenAPI files on disk.
 */
export const recursiveRef = (schema: Schema): Schema =>
  union([
    schema,
    intersection([openApiReferenceObject, object({ '$ref-value': evaluate(e, schema) }), referenceExtensions]),
  ])
