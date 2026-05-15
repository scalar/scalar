import { array, object, optional, string, union } from '@scalar/validation'

import { asyncApiOperationBindingsObject } from './bindings'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiReferenceObject, normalRef } from './reference'
import { asyncApiSecuritySchemeObject } from './security-scheme'
import { asyncApiTagsObject } from './tag'

export const asyncApiOperationTraitObject = union(
  [
    asyncApiReferenceObject,
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
          array(normalRef(asyncApiSecuritySchemeObject), {
            typeComment:
              'Security schemes for this operation. Only one of the security scheme objects MUST be satisfied.',
          }),
        ),
        tags: optional(asyncApiTagsObject),
        externalDocs: optional(normalRef(asyncApiExternalDocumentationObject)),
        bindings: optional(normalRef(asyncApiOperationBindingsObject)),
      },
      { typeName: 'AsyncApiOperationTraitObject' },
    ),
  ],
  { typeName: 'AsyncApiOperationTraitOrReference' },
)
