import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XOriginalAasVersion = object(
  {
    'x-original-aas-version': optional(
      string({ typeComment: 'Original AsyncAPI Specification version the document was loaded with.' }),
    ),
  },
  {
    typeName: 'XOriginalAasVersion',
    typeComment: typeCommentWithExample(
      'Original AsyncAPI Specification version of the source document before ingestion.',
      { language: 'yaml', body: 'x-original-aas-version: "3.0.0"' },
    ),
  },
)
