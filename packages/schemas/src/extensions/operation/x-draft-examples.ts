import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XDraftExamples = object(
  {
    'x-draft-examples': optional(
      array(string(), {
        typeComment: 'Identifiers of draft examples attached to this operation',
      }),
    ),
  },
  {
    typeName: 'XDraftExamples',
    typeComment: typeCommentWithExample(
      'Draft example identifiers for an operation (in-progress examples not yet committed).',
      {
        language: 'yaml',
        body: `x-draft-examples:
  - default
  - error-case`,
      },
    ),
  },
)
