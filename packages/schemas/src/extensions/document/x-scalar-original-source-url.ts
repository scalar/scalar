import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarOriginalSourceUrl = object(
  {
    'x-scalar-original-source-url': optional(
      string({ typeComment: 'Original document source URL when loaded from an external source' }),
    ),
  },
  {
    typeName: 'XScalarOriginalSourceUrl',
    typeComment: typeCommentWithExample(
      'Original document source URL when the API description was loaded from an external source.',
      { language: 'yaml', body: 'x-scalar-original-source-url: https://example.com/openapi.yaml' },
    ),
  },
)
