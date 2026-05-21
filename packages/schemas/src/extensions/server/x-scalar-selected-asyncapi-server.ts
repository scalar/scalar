import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarSelectedAsyncapiServer = object(
  {
    'x-scalar-selected-asyncapi-server': optional(
      string({ typeComment: 'The name of the currently selected AsyncAPI server (key in document.servers)' }),
    ),
  },
  {
    typeName: 'XScalarSelectedAsyncapiServer',
    typeComment: typeCommentWithExample(
      'The name of the currently selected AsyncAPI server for this API description.',
      {
        language: 'yaml',
        body: 'x-scalar-selected-asyncapi-server: production',
      },
    ),
  },
)
