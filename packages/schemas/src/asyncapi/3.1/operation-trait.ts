import { array, object, optional, string } from '@scalar/validation'

import { asyncApiOperationBindingsObject } from './bindings'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { recursiveRef } from './reference'
import { asyncApiSecuritySchemeObject } from './security-scheme'
import { asyncApiTagsObject } from './tag'

/** Operation Trait Object | Reference Object */
export const asyncApiOperationTraitObject = recursiveRef(
  object(
    {
      title: optional(string({ typeComment: 'A human-friendly title for the operation.' })),
      summary: optional(string({ typeComment: 'A short summary of what the operation is about.' })),
      description: optional(
        string({
          typeComment:
            'A verbose explanation of the operation. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      security: optional(
        array(asyncApiSecuritySchemeObject, {
          typeComment:
            'Security schemes for this operation. Only one of the security scheme objects MUST be satisfied.',
        }),
      ),
      tags: optional(asyncApiTagsObject),
      externalDocs: optional(asyncApiExternalDocumentationObject),
      bindings: optional(recursiveRef(asyncApiOperationBindingsObject)),
    },
    { typeName: 'AsyncApiOperationTraitObject' },
  ),
)
