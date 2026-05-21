import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(
      string({
        typeComment:
          'The currently selected server. For OpenAPI documents this is the server URL; for AsyncAPI documents this is the server name (key in `document.servers`).',
      }),
    ),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment: typeCommentWithExample(
      'The currently selected server for this API description. For OpenAPI documents the value is the server URL; for AsyncAPI documents the value is the server name (key in `document.servers`).',
      {
        language: 'yaml',
        body: 'x-scalar-selected-server: https://api.example.com',
      },
    ),
  },
)
