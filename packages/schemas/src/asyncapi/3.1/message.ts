import { array, lazy, object, optional, record, string } from '@scalar/validation'

import { asyncApiMessageBindingsObject } from './bindings'
import { asyncApiCorrelationIdObject } from './correlation-id'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiMessageExampleObject } from './message-example'
import { asyncApiMessageTraitObject } from './message-trait'
import { normalRef } from './reference'
import { asyncApiSchemaPayload } from './schema-payload'
import { asyncApiTagsObject } from './tag'

/** Message Object | Reference Object */
export const asyncApiMessageObject = lazy(() =>
  normalRef(
    object(
      {
        headers: optional(asyncApiSchemaPayload),
        payload: optional(asyncApiSchemaPayload),
        correlationId: optional(asyncApiCorrelationIdObject),
        contentType: optional(
          string({
            typeComment:
              'The content type to use when encoding/decoding a message payload (for example application/json).',
          }),
        ),
        name: optional(string({ typeComment: 'A machine-friendly name for the message.' })),
        title: optional(string({ typeComment: 'A human-friendly title for the message.' })),
        summary: optional(string({ typeComment: 'A short summary of what the message is about.' })),
        description: optional(
          string({
            typeComment:
              'A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        tags: optional(asyncApiTagsObject),
        externalDocs: optional(asyncApiExternalDocumentationObject),
        bindings: optional(normalRef(asyncApiMessageBindingsObject)),
        examples: optional(array(normalRef(asyncApiMessageExampleObject))),
        traits: optional(array(asyncApiMessageTraitObject)),
      },
      { typeName: 'AsyncApiMessageObject' },
    ),
  ),
)

export const asyncApiMessagesObject = record(string(), asyncApiMessageObject, {
  typeName: 'AsyncApiMessagesObject',
  typeComment: 'Map of messageId to Message Object or Reference Object.',
})
