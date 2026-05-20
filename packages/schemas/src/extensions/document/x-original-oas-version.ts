import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XOriginalOasVersion = object(
  {
    'x-original-oas-version': optional(
      string({
        typeComment: 'OpenAPI Specification version of the source document (for example `3.1.0`)',
      }),
    ),
  },
  {
    typeName: 'XOriginalOasVersion',
    typeComment: typeCommentWithExample(
      'Original OpenAPI Specification version of the source document before ingestion.',
      { language: 'yaml', body: 'x-original-oas-version: "3.1.0"' },
    ),
  },
)
