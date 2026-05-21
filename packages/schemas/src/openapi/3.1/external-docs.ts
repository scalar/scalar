import { object, optional, string } from '@scalar/validation'

export const externalDocs = object(
  {
    url: string({
      typeComment: 'REQUIRED. The URI for the target documentation. This MUST be in the form of a URI.',
    }),
    description: optional(
      string({
        typeComment:
          'A description of the target documentation. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
  },
  { typeName: 'ExternalDocumentationObject' },
)
