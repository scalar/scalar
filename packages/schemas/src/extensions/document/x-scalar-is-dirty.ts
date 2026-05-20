import { boolean, object, optional } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarIsDirty = object(
  {
    'x-scalar-is-dirty': optional(
      boolean({
        typeComment: 'When true, the document has unsaved changes',
      }),
    ),
  },
  {
    typeName: 'XScalarIsDirty',
    typeComment: typeCommentWithExample('Tracks whether the document has been modified since it was last saved.', {
      language: 'yaml',
      body: 'x-scalar-is-dirty: true',
    }),
  },
)
