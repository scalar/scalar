import { boolean, object, optional } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/** Internal extension to mark an entity as ignored in the Scalar UI */
export const XScalarIgnore = object(
  {
    'x-scalar-ignore': optional(boolean({ typeComment: 'When true, the entity is hidden or ignored in the UI' })),
  },
  {
    typeName: 'XScalarIgnore',
    typeComment: typeCommentWithExample('Internal extension to mark an entity as ignored in the Scalar UI.', {
      language: 'yaml',
      body: 'x-scalar-ignore: true',
    }),
  },
)
