import { boolean, object, optional } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarWatchMode = object(
  {
    'x-scalar-watch-mode': optional(
      boolean({ typeComment: 'When true, the document is watched for external file changes' }),
    ),
  },
  {
    typeName: 'XScalarWatchMode',
    typeComment: typeCommentWithExample(
      'Whether the document is in watch mode (reloads when the source file changes).',
      { language: 'yaml', body: 'x-scalar-watch-mode: true' },
    ),
  },
)
