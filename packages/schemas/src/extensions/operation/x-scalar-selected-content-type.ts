import { object, optional, record, string } from '@scalar/validation'

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
    typeComment:
      'Selected content type per example for request or response bodies. Keys are example names; values are media types.\n\n@example\n```yaml\nx-scalar-selected-content-type:\n  default: application/json\n  xml-example: application/xml\n```',
  },
)
