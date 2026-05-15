import { lazy, object, optional, record, string } from '@scalar/validation'

import {
  asyncApiChannelBindingsObject,
  asyncApiMessageBindingsObject,
  asyncApiOperationBindingsObject,
  asyncApiServerBindingsObject,
} from './bindings'
import { asyncApiChannelObject } from './channel'
import { asyncApiCorrelationIdObject } from './correlation-id'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiMessageObject } from './message'
import { asyncApiMessageTraitObject } from './message-trait'
import { asyncApiOperationObject } from './operation'
import { asyncApiOperationReplyObject } from './operation-reply'
import { asyncApiOperationReplyAddressObject } from './operation-reply-address'
import { asyncApiOperationTraitObject } from './operation-trait'
import { asyncApiParameterObject } from './parameter'
import { normalRef } from './reference'
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
      servers: optional(record(string(), normalRef(asyncApiServerObject))),
      channels: optional(record(string(), normalRef(asyncApiChannelObject))),
      operations: optional(record(string(), normalRef(asyncApiOperationObject))),
      messages: optional(record(string(), normalRef(asyncApiMessageObject))),
      securitySchemes: optional(record(string(), normalRef(asyncApiSecuritySchemeObject))),
      serverVariables: optional(record(string(), normalRef(asyncApiServerVariableObject))),
      parameters: optional(record(string(), normalRef(asyncApiParameterObject))),
      correlationIds: optional(record(string(), normalRef(asyncApiCorrelationIdObject))),
      replies: optional(record(string(), normalRef(asyncApiOperationReplyObject))),
      replyAddresses: optional(record(string(), normalRef(asyncApiOperationReplyAddressObject))),
      externalDocs: optional(record(string(), normalRef(asyncApiExternalDocumentationObject))),
      tags: optional(record(string(), normalRef(asyncApiTagObject))),
      operationTraits: optional(record(string(), normalRef(asyncApiOperationTraitObject))),
      messageTraits: optional(record(string(), normalRef(asyncApiMessageTraitObject))),
      serverBindings: optional(record(string(), normalRef(asyncApiServerBindingsObject))),
      channelBindings: optional(record(string(), normalRef(asyncApiChannelBindingsObject))),
      operationBindings: optional(record(string(), normalRef(asyncApiOperationBindingsObject))),
      messageBindings: optional(record(string(), normalRef(asyncApiMessageBindingsObject))),
    },
    {
      typeName: 'AsyncApiComponentsObject',
      typeComment: 'Reusable objects. Definitions here have no effect unless referenced from outside components.',
    },
  ),
)
