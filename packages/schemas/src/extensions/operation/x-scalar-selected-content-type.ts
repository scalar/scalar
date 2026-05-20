import { object, optional, record, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Schema for the x-scalar-selected-content-type extension on an OpenAPI operation.
 *
 * The key represents the example name, and the value is the selected content type string.
 * Used by Scalar to track which content type is selected for each example in request or response bodies.
 */
export const XScalarSelectedContentType = object(
  {
    'x-scalar-selected-content-type': optional(
      record(string(), string(), {
        typeComment: 'Map of example name to selected content type (for example `application/json`)',
      }),
    ),
  },
  {
    typeName: 'XScalarSelectedContentType',
    typeComment: typeCommentWithExample(
      'Selected content type per example for request or response bodies. Keys are example names; values are media types.',
      {
        language: 'yaml',
        body: `x-scalar-selected-content-type:
  default: application/json
  xml-example: application/xml`,
      },
    ),
  },
)
