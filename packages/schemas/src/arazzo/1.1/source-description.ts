import { literal, object, optional, string, union } from '@scalar/validation'

export const arazzoSourceDescriptionObject = object(
  {
    name: string({
      typeComment:
        'REQUIRED. A unique name for the source description. SHOULD conform to the regular expression [A-Za-z0-9_\\-]+.',
    }),
    url: string({
      typeComment: 'REQUIRED. A URL to a source description to be used by a workflow.',
    }),
    type: optional(
      union([literal('openapi'), literal('asyncapi'), literal('arazzo')], {
        typeComment: 'The type of source description. Possible values are "openapi", "asyncapi", or "arazzo".',
      }),
    ),
  },
  { typeName: 'ArazzoSourceDescriptionObject' },
)
