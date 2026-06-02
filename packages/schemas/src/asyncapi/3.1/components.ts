import { lazy, object, optional, record, string } from '@scalar/validation'

import {
  asyncApiChannelBindingsObject,
  asyncApiMessageBindingsObject,
  asyncApiOperationBindingsObject,
  asyncApiServerBindingsObject,
} from './bindings'
import { asyncApiChannelsObject } from './channel'
import { asyncApiCorrelationIdObject } from './correlation-id'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiMessageObject } from './message'
import { asyncApiMessageTraitObject } from './message-trait'
import { asyncApiOperationObject } from './operation'
import { asyncApiOperationReplyObject } from './operation-reply'
import { asyncApiOperationReplyAddressObject } from './operation-reply-address'
import { asyncApiOperationTraitObject } from './operation-trait'
import { asyncApiParameterObject } from './parameter'
import { recursiveRef } from './reference'
import { asyncApiSchemaPayload } from './schema-payload'
import { asyncApiSecuritySchemeObject } from './security-scheme'
import { asyncApiServerObject } from './server'
import { asyncApiServerVariableObject } from './server-variable'
import { asyncApiTagObject } from './tag'

export const asyncApiComponentsObject = lazy(() =>
  object(
    {
      schemas: optional(
        record(string(), asyncApiSchemaPayload, {
          typeComment: 'Reusable Multi Format Schema, Schema Object, or Reference Object.',
        }),
      ),
      servers: optional(record(string(), asyncApiServerObject)),
      channels: optional(asyncApiChannelsObject),
      operations: optional(record(string(), asyncApiOperationObject)),
      messages: optional(record(string(), asyncApiMessageObject)),
      securitySchemes: optional(record(string(), asyncApiSecuritySchemeObject)),
      serverVariables: optional(record(string(), asyncApiServerVariableObject)),
      parameters: optional(record(string(), asyncApiParameterObject)),
      correlationIds: optional(record(string(), asyncApiCorrelationIdObject)),
      replies: optional(record(string(), asyncApiOperationReplyObject)),
      replyAddresses: optional(record(string(), asyncApiOperationReplyAddressObject)),
      externalDocs: optional(record(string(), asyncApiExternalDocumentationObject)),
      tags: optional(record(string(), asyncApiTagObject)),
      operationTraits: optional(record(string(), asyncApiOperationTraitObject)),
      messageTraits: optional(record(string(), asyncApiMessageTraitObject)),
      serverBindings: optional(record(string(), recursiveRef(asyncApiServerBindingsObject))),
      channelBindings: optional(record(string(), recursiveRef(asyncApiChannelBindingsObject))),
      operationBindings: optional(record(string(), recursiveRef(asyncApiOperationBindingsObject))),
      messageBindings: optional(record(string(), recursiveRef(asyncApiMessageBindingsObject))),
    },
    {
      typeName: 'AsyncApiComponentsObject',
      typeComment: 'Reusable objects. Definitions here have no effect unless referenced from outside components.',
    },
  ),
)
