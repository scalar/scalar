import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

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
    typeComment: typeCommentWithExample(
      'Custom display order for elements in the Scalar UI (tags, operations, tag groups).',
      {
        language: 'yaml',
        body: `x-scalar-order:
  - users
  - pets
  - admin`,
      },
    ),
  },
)
