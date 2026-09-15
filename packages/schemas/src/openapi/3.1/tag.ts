import { intersection, object, optional, string } from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XScalarOrder } from '@/extensions/general'
import { XDisplayName } from '@/extensions/tag'
import { externalDocs } from '@/openapi/3.1/external-docs'

export const tag = intersection(
  [
    object({
      name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
      summary: optional(
        string({ typeComment: 'A short summary of the tag, used for display purposes. (OpenAPI 3.2)' }),
      ),
      description: optional(
        string({
          typeComment: 'A description for the tag. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      parent: optional(
        string({
          typeComment:
            'The name of a tag that this tag is nested under. The named tag MUST exist in the API description, and circular references MUST NOT be used. (OpenAPI 3.2)',
        }),
      ),
      kind: optional(
        string({
          typeComment:
            'A machine-readable string to categorize what sort of tag it is, for example `nav`, `badge` or `audience`. (OpenAPI 3.2)',
        }),
      ),
      externalDocs: optional(externalDocs),
    }),
    XDisplayName,
    XInternal,
    XScalarIgnore,
    XScalarOrder,
  ],
  { typeName: 'TagObject' },
)
