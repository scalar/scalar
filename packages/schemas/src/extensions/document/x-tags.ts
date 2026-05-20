import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XTags = object(
  {
    'x-tags': optional(
      array(string(), {
        typeComment: 'Ordered list of tag names for this schema object',
      }),
    ),
  },
  {
    typeName: 'XTags',
    typeComment: typeCommentWithExample('Custom tag ordering hints for schema objects in the sidebar.', {
      language: 'yaml',
      body: `x-tags:
  - users
  - admin`,
    }),
  },
)
