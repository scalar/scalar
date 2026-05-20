import { object, string } from '@scalar/validation'

export const XScalarOriginalDocumentHash = object(
  {
    'x-scalar-original-document-hash': string({
      typeComment: 'Hash of the document as originally loaded from an external source',
    }),
  },
  {
    typeName: 'XScalarOriginalDocumentHash',
    typeComment:
      'Tracks the original document hash when loading from an external source. Used to detect modifications since last save.\n\n@example\n```yaml\nx-scalar-original-document-hash: "abc123"\n```',
  },
)
