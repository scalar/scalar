import { any, object, optional } from '@scalar/validation'

export const XScalarNavigation = object(
  {
    'x-scalar-navigation': optional(
      any({
        typeComment: 'Serialized client navigation tree (`TraversedDocument`) for this API description',
      }),
    ),
  },
  {
    typeName: 'XScalarNavigation',
    typeComment:
      'Client-side navigation tree persisted on the document. Matches `TraversedDocumentObjectRef` in strict OpenAPI schemas.',
  },
)
