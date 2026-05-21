import { object, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarOriginalDocumentHash = object(
  {
    'x-scalar-original-document-hash': string({
      typeComment: 'Hash of the document as originally loaded from an external source',
    }),
  },
  {
    typeName: 'XScalarOriginalDocumentHash',
    typeComment: typeCommentWithExample(
      'Tracks the original document hash when loading from an external source. Used to detect modifications since last save.',
      { language: 'yaml', body: 'x-scalar-original-document-hash: "abc123"' },
    ),
  },
)
