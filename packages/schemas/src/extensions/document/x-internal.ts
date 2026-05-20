import { boolean, object, optional } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XInternal = object(
  {
    'x-internal': optional(boolean({ typeComment: 'When true, hides the entity from public documentation' })),
  },
  {
    typeName: 'XInternal',
    typeComment: typeCommentWithExample('Marks an entity as internal (hidden from external consumers).', {
      language: 'yaml',
      body: 'x-internal: true',
    }),
  },
)
