import { array, lazy, literal, object, optional, record, string, union } from '@scalar/validation'

import { asyncApiOperationBindingsObject } from './bindings'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiOperationReplyObject } from './operation-reply'
import { asyncApiOperationTraitObject } from './operation-trait'
import { asyncApiReferenceObject, normalRef } from './reference'
import { asyncApiSecuritySchemeObject } from './security-scheme'
import { asyncApiTagsObject } from './tag'

/** Operation Object | Reference Object */
export const asyncApiOperationObject = lazy(() =>
  normalRef(
    object(
      {
        action: union([literal('send'), literal('receive')], {
          typeComment:
            'REQUIRED. send when the application sends to the channel; receive when it receives from the channel.',
        }),
        channel: asyncApiReferenceObject,
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
        bindings: optional(normalRef(asyncApiOperationBindingsObject)),
        traits: optional(array(asyncApiOperationTraitObject)),
        messages: optional(
          array(asyncApiReferenceObject, {
            typeComment:
              'Subset of channel messages as Reference Objects only. Omit to include all channel messages; use [] for none.',
          }),
        ),
        reply: optional(asyncApiOperationReplyObject),
      },
      { typeName: 'AsyncApiOperationObject' },
    ),
  ),
)

export const asyncApiOperationsObject = record(string(), asyncApiOperationObject, {
  typeName: 'AsyncApiOperationsObject',
  typeComment: 'Map of operationId to Operation Object or Reference Object.',
})
