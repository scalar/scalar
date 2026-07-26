import { object, optional, string } from '@scalar/validation'

export const arazzoInfoObject = object(
  {
    title: string({ typeComment: 'REQUIRED. A human readable title of the Arazzo Description.' }),
    summary: optional(string({ typeComment: 'A short summary of the Arazzo Description.' })),
    description: optional(
      string({
        typeComment:
          'A description of the purpose of the workflows defined. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    version: string({
      typeComment:
        'REQUIRED. The version identifier of the Arazzo document (distinct from the Arazzo Specification version).',
    }),
  },
  { typeName: 'ArazzoInfoObject' },
)
