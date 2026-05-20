import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(string({ typeComment: 'The URL of the currently selected server' })),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment: typeCommentWithExample('The URL of the currently selected server for this API description.', {
      language: 'yaml',
      body: 'x-scalar-selected-server: https://api.example.com',
    }),
  },
)
