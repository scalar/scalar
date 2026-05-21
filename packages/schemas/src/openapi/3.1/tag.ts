import { intersection, object, optional, string } from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XScalarOrder } from '@/extensions/general'
import { XDisplayName } from '@/extensions/tag'
import { externalDocs } from '@/openapi/3.1/external-docs'

export const tag = intersection(
  [
    object({
      name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
      description: optional(
        string({
          typeComment: 'A description for the tag. CommonMark syntax MAY be used for rich text representation.',
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
