import { array, lazy, object, optional, record, string } from '@scalar/validation'

import { asyncApiMessageBindingsObject } from './bindings'
import { createAsyncApiCorrelationIdObject } from './correlation-id'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiMessageExampleObject } from './message-example'
import { createAsyncApiMessageTraitObject } from './message-trait'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiSchemaPayload } from './schema-payload'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds Message-related schemas for {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `messageObject` — **Reference union** (`Message Object | Reference Object`). Lazy for
 *   circular dependencies. Do not wrap again.
 * @returns `messagesObject` — Map whose values use the same union.
 */
export const createAsyncApiMessageSchemas = (maybeRef: MaybeRefFn) => {
  const schemaPayload = createAsyncApiSchemaPayload(maybeRef)
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const correlationId = createAsyncApiCorrelationIdObject(maybeRef)
  const messageTrait = createAsyncApiMessageTraitObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  const messageObject = lazy(() =>
    maybeRef(
      object(
        {
          headers: optional(schemaPayload),
          payload: optional(schemaPayload),
          correlationId: optional(correlationId),
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
          tags: optional(tagsObject),
          externalDocs: optional(externalDocumentation),
          bindings: optional(maybeRef(asyncApiMessageBindingsObject)),
          examples: optional(array(maybeRef(asyncApiMessageExampleObject))),
          traits: optional(array(messageTrait)),
        },
        { typeName: 'AsyncApiMessageObject' },
      ),
    ),
  )

  const messagesObject = record(string(), messageObject, {
    typeName: 'AsyncApiMessagesObject',
    typeComment: 'Map of messageId to Message Object or Reference Object.',
  })

  return { messageObject, messagesObject }
}

const defaultMessageSchemas = createAsyncApiMessageSchemas(normalRef)

export const asyncApiMessageObject = defaultMessageSchemas.messageObject
export const asyncApiMessagesObject = defaultMessageSchemas.messagesObject
