import { any, object, optional, record, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XExamples = object(
  {
    'x-examples': optional(
      record(string(), any(), {
        typeComment: 'Map of example name to example value',
      }),
    ),
  },
  {
    typeName: 'XExamples',
    typeComment: typeCommentWithExample(
      'Named examples attached to a schema. Keys are example names; values are the example payloads.',
      {
        language: 'yaml',
        body: `x-examples:
  user:
    id: 1
    name: Ada`,
      },
    ),
  },
)
