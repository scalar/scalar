import { intersection, object, optional, string } from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XScalarOrder } from '@/extensions/general'
import { XDisplayName } from '@/extensions/tag'

import { openApiExternalDocumentationObject } from './external-documentation'

export const openApiTagObject = intersection(
  [
    object({
      name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
      description: optional(
        string({
          typeComment: 'A description for the tag. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      externalDocs: optional(openApiExternalDocumentationObject),
    }),
    XDisplayName,
    XInternal,
    XScalarIgnore,
    XScalarOrder,
  ],
  { typeName: 'TagObject' },
)
