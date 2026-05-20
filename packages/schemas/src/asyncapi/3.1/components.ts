import { lazy, object, optional, record, string } from '@scalar/validation'

import {
  asyncApiChannelBindingsObject,
  asyncApiMessageBindingsObject,
  asyncApiOperationBindingsObject,
  asyncApiServerBindingsObject,
} from './bindings'
import { createAsyncApiChannelSchemas } from './channel'
import { createAsyncApiCorrelationIdObject } from './correlation-id'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { createAsyncApiMessageSchemas } from './message'
import { createAsyncApiMessageTraitObject } from './message-trait'
import { createAsyncApiOperationSchemas } from './operation'
import { createAsyncApiOperationReplyObject } from './operation-reply'
import { createAsyncApiOperationReplyAddressObject } from './operation-reply-address'
import { createAsyncApiOperationTraitObject } from './operation-trait'
import { createAsyncApiParameterObject } from './parameter'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiSchemaPayload } from './schema-payload'
import { createAsyncApiSecuritySchemeObject } from './security-scheme'
import { createAsyncApiServerSchemas } from './server'
import { createAsyncApiServerVariableObject } from './server-variable'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds the Components Object schema for {@link generateSchema}.
 *
 * **Not a reference union:** The components container is always inline (lazy for circular
 * dependencies). Each map under `components` uses values from other `create*` factories that
 * are already `Object | Reference Object` unions. The root document wraps this schema once in
 * `maybeRef` via {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiComponentsObject = (maybeRef: MaybeRefFn) => {
  const schemaPayload = createAsyncApiSchemaPayload(maybeRef)
  const { serverObject } = createAsyncApiServerSchemas(maybeRef)
  const { channelObject } = createAsyncApiChannelSchemas(maybeRef)
  const { operationObject } = createAsyncApiOperationSchemas(maybeRef)
  const { messageObject } = createAsyncApiMessageSchemas(maybeRef)
  const securityScheme = createAsyncApiSecuritySchemeObject(maybeRef)
  const serverVariable = createAsyncApiServerVariableObject(maybeRef)
  const parameter = createAsyncApiParameterObject(maybeRef)
  const correlationId = createAsyncApiCorrelationIdObject(maybeRef)
  const operationReply = createAsyncApiOperationReplyObject(maybeRef)
  const replyAddress = createAsyncApiOperationReplyAddressObject(maybeRef)
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const { tagObject } = createAsyncApiTagSchemas(maybeRef)
  const operationTrait = createAsyncApiOperationTraitObject(maybeRef)
  const messageTrait = createAsyncApiMessageTraitObject(maybeRef)

  return lazy(() =>
    object(
      {
        schemas: optional(
          record(string(), schemaPayload, {
            typeComment: 'Reusable Multi Format Schema, Schema Object, or Reference Object.',
          }),
        ),
        servers: optional(record(string(), serverObject)),
        channels: optional(record(string(), channelObject)),
        operations: optional(record(string(), operationObject)),
        messages: optional(record(string(), messageObject)),
        securitySchemes: optional(record(string(), securityScheme)),
        serverVariables: optional(record(string(), serverVariable)),
        parameters: optional(record(string(), parameter)),
        correlationIds: optional(record(string(), correlationId)),
        replies: optional(record(string(), operationReply)),
        replyAddresses: optional(record(string(), replyAddress)),
        externalDocs: optional(record(string(), externalDocumentation)),
        tags: optional(record(string(), tagObject)),
        operationTraits: optional(record(string(), operationTrait)),
        messageTraits: optional(record(string(), messageTrait)),
        serverBindings: optional(record(string(), maybeRef(asyncApiServerBindingsObject))),
        channelBindings: optional(record(string(), maybeRef(asyncApiChannelBindingsObject))),
        operationBindings: optional(record(string(), maybeRef(asyncApiOperationBindingsObject))),
        messageBindings: optional(record(string(), maybeRef(asyncApiMessageBindingsObject))),
      },
      {
        typeName: 'AsyncApiComponentsObject',
        typeComment: 'Reusable objects. Definitions here have no effect unless referenced from outside components.',
      },
    ),
  )
}

export const asyncApiComponentsObject = createAsyncApiComponentsObject(normalRef)
