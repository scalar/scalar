import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XVariable = object(
  {
    'x-variable': optional(string({ typeComment: 'Variable name used for substitution in the API client' })),
  },
  {
    typeName: 'XVariable',
    typeComment: typeCommentWithExample('References a variable for schema property substitution in the API client.', {
      language: 'yaml',
      body: 'x-variable: userId',
    }),
  },
)
