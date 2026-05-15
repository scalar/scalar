import { type Schema, object, string, union } from '@scalar/validation'

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

/** Inline value or a reference to the same shape. */
export const normalRef = (schema: Schema): Schema => union([schema, asyncApiReferenceObject])
