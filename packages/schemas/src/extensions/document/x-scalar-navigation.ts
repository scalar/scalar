import { any, object, optional } from '@scalar/validation'

export const XScalarNavigation = object(
  {
    'x-scalar-navigation': optional(
      any({
        typeComment:
          'Client navigation tree (TraversedDocument) for this OpenAPI description. Matches TraversedDocumentObjectRef in strict schemas.',
      }),
    ),
  },
  {
    typeName: 'XScalarNavigation',
    typeComment: 'Client navigation tree for this OpenAPI description',
  },
)
