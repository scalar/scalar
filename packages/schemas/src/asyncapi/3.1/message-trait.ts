import { array, object, optional, string } from '@scalar/validation'

import { asyncApiMessageBindingsObject } from './bindings'
import { createAsyncApiCorrelationIdObject } from './correlation-id'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiMessageExampleObject } from './message-example'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiSchemaPayload } from './schema-payload'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds the Message Trait Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Message Trait Object | Reference Object`. Nested fields such as
 * `correlationId` and `externalDocs` use other `create*` results that are already reference
 * unions. Do not wrap the return value in `maybeRef` again.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiMessageTraitObject = (maybeRef: MaybeRefFn) => {
  const schemaPayload = createAsyncApiSchemaPayload(maybeRef)
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const correlationId = createAsyncApiCorrelationIdObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  return maybeRef(
    object(
      {
        headers: optional(schemaPayload),
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
      },
      { typeName: 'AsyncApiMessageTraitObject' },
    ),
  )
}

export const asyncApiMessageTraitObject = createAsyncApiMessageTraitObject(normalRef)
