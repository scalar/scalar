import { Type } from '@scalar/typebox'
import { object, optional, record, string } from '@scalar/validation'

/**
 * Schema for the x-scalar-selected-content-type extension on an OpenAPI operation.
 *
 * The key represents the example name, and the value is the selected content type string.
 * Used by Scalar to track which content type is selected for each example in request or response bodies.
 */
export const XScalarSelectedContentTypeSchema = Type.Object({
  'x-scalar-selected-content-type': Type.Optional(Type.Record(Type.String(), Type.String())),
})

/**
 * Type definition for the x-scalar-selected-content-type extension on an OpenAPI operation.
 *
 * The key represents the example name, and the value is the selected content type string.
 * Used by Scalar to track which content type is selected for each example in request or response bodies.
 */
export type XScalarSelectedContentType = {
  'x-scalar-selected-content-type'?: {
    [key: string]: string
  }
}

export const XScalarSelectedContentType = object(
  {
    'x-scalar-selected-content-type': optional(
      record(string(), string(), {
        typeComment: 'Selected content type per example name',
      }),
    ),
  },
  {
    typeName: 'XScalarSelectedContentType',
    typeComment: 'Selected content type per example for request or response bodies',
  },
)
