import { array, object, optional, string } from '@scalar/validation'

export const XScalarOrder = object(
  {
    'x-scalar-order': optional(
      array(string(), {
        typeComment: 'Ordered list of element identifiers (tags, operations, etc.)',
      }),
    ),
  },
  {
    typeName: 'XScalarOrder',
    typeComment:
      'Custom display order for elements in the Scalar UI (tags, operations, tag groups).\n\n@example\n```yaml\nx-scalar-order:\n  - users\n  - pets\n  - admin\n```',
  },
)
