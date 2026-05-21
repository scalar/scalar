import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarIcon = object(
  {
    'x-scalar-icon': optional(string({ typeComment: 'Icon identifier or URL for the API description' })),
  },
  {
    typeName: 'XScalarIcon',
    typeComment: typeCommentWithExample('A custom icon representing the API description in the Scalar UI.', {
      language: 'yaml',
      body: 'x-scalar-icon: rocket',
    }),
  },
)
