import { Type } from '@scalar/typebox'

import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import { ExternalDocumentationObjectRef, SchemaObjectRef, TagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import type {
  ChannelBindingsObject,
  MessageBindingsObject,
  OperationBindingsObject,
  ServerBindingsObject,
} from './binding'
import type { ChannelObject } from './channel-item'
import type { CorrelationIdObject } from './correlation-id'
import type { MessageObject } from './message'
import type { MessageTraitObject } from './message-trait'
import type { MultiFormatSchemaObject } from './multi-format-schema'
import type { OperationObject } from './operation'
import type { OperationTraitObject } from './operation-trait'
import type { ParameterObject } from './parameter'
import {
  ChannelBindingsObjectRef,
  ChannelObjectRef,
  CorrelationIdObjectRef,
  MessageBindingsObjectRef,
  MessageObjectRef,
  MessageTraitObjectRef,
  MultiFormatSchemaObjectRef,
  OperationBindingsObjectRef,
  OperationRef,
  OperationTraitObjectRef,
  ParameterObjectRef,
  ReplyAddressObjectRef,
  ReplyObjectRef,
  SecuritySchemeObjectRef,
  ServerBindingsObjectRef,
  ServerObjectRef,
  ServerVariableObjectRef,
} from './ref-definitions'
import type { ReplyObject } from './reply'
import type { ReplyAddressObject } from './reply-address'
import type { SecuritySchemeObject } from './security-scheme'
import type { ServerObject, ServerVariableObject } from './server'

/**
 * Holds a set of reusable objects for different aspects of the AsyncAPI specification.
 * All objects defined within the components object will have no effect on the API unless they are explicitly referenced from outside the components object.
 */
export const ComponentsObjectSchemaDefinition = Type.Object({
  /** An object to hold reusable Schema Objects. */
  schemas: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([
        SchemaObjectRef,
        MultiFormatSchemaObjectRef,
        reference(SchemaObjectRef),
        reference(MultiFormatSchemaObjectRef),
      ]),
    ),
  ),
  /** An object to hold reusable Server Objects. */
  servers: Type.Optional(Type.Record(Type.String(), Type.Union([ServerObjectRef, reference(ServerObjectRef)]))),
  /** An object to hold reusable Channel Objects. */
  channels: Type.Optional(Type.Record(Type.String(), Type.Union([ChannelObjectRef, reference(ChannelObjectRef)]))),
  /** An object to hold reusable Operation Objects. */
  operations: Type.Optional(Type.Record(Type.String(), Type.Union([OperationRef, reference(OperationRef)]))),
  /** An object to hold reusable Message Objects. */
  messages: Type.Optional(Type.Record(Type.String(), Type.Union([MessageObjectRef, reference(MessageObjectRef)]))),
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes: Type.Optional(
    Type.Record(Type.String(), Type.Union([SecuritySchemeObjectRef, reference(SecuritySchemeObjectRef)])),
  ),
  /** An object to hold reusable Server Variable Objects. */
  serverVariables: Type.Optional(
    Type.Record(Type.String(), Type.Union([ServerVariableObjectRef, reference(ServerVariableObjectRef)])),
  ),
  /** An object to hold reusable Parameter Objects. */
  parameters: Type.Optional(
    Type.Record(Type.String(), Type.Union([ParameterObjectRef, reference(ParameterObjectRef)])),
  ),
  /** An object to hold reusable Correlation ID Objects. */
  correlationIds: Type.Optional(
    Type.Record(Type.String(), Type.Union([CorrelationIdObjectRef, reference(CorrelationIdObjectRef)])),
  ),
  /** An object to hold reusable Reply Objects. */
  replies: Type.Optional(Type.Record(Type.String(), Type.Union([ReplyObjectRef, reference(ReplyObjectRef)]))),
  /** An object to hold reusable Reply Address Objects. */
  replyAddresses: Type.Optional(
    Type.Record(Type.String(), Type.Union([ReplyAddressObjectRef, reference(ReplyAddressObjectRef)])),
  ),
  /** An object to hold reusable External Documentation Objects. */
  externalDocs: Type.Optional(
    Type.Record(Type.String(), Type.Union([ExternalDocumentationObjectRef, reference(ExternalDocumentationObjectRef)])),
  ),
  /** An object to hold reusable Tag Objects. */
  tags: Type.Optional(Type.Record(Type.String(), Type.Union([TagObjectRef, reference(TagObjectRef)]))),
  /** An object to hold reusable Operation Trait Objects. */
  operationTraits: Type.Optional(
    Type.Record(Type.String(), Type.Union([OperationTraitObjectRef, reference(OperationTraitObjectRef)])),
  ),
  /** An object to hold reusable Message Trait Objects. */
  messageTraits: Type.Optional(
    Type.Record(Type.String(), Type.Union([MessageTraitObjectRef, reference(MessageTraitObjectRef)])),
  ),
  /** An object to hold reusable Server Bindings Objects. */
  serverBindings: Type.Optional(
    Type.Record(Type.String(), Type.Union([ServerBindingsObjectRef, reference(ServerBindingsObjectRef)])),
  ),
  /** An object to hold reusable Channel Bindings Objects. */
  channelBindings: Type.Optional(
    Type.Record(Type.String(), Type.Union([ChannelBindingsObjectRef, reference(ChannelBindingsObjectRef)])),
  ),
  /** An object to hold reusable Operation Bindings Objects. */
  operationBindings: Type.Optional(
    Type.Record(Type.String(), Type.Union([OperationBindingsObjectRef, reference(OperationBindingsObjectRef)])),
  ),
  /** An object to hold reusable Message Bindings Objects. */
  messageBindings: Type.Optional(
    Type.Record(Type.String(), Type.Union([MessageBindingsObjectRef, reference(MessageBindingsObjectRef)])),
  ),
})

/**
 * Holds a set of reusable objects for different aspects of the AsyncAPI specification.
 * All objects defined within the components object will have no effect on the API unless they are explicitly referenced from outside the components object.
 */
export type ComponentsObject = {
  /** An object to hold reusable Schema Objects. */
  schemas?: Record<string, ReferenceType<SchemaObject | MultiFormatSchemaObject>>
  /** An object to hold reusable Server Objects. */
  servers?: Record<string, ReferenceType<ServerObject>>
  /** An object to hold reusable Channel Objects. */
  channels?: Record<string, ReferenceType<ChannelObject>>
  /** An object to hold reusable Operation Objects. */
  operations?: Record<string, ReferenceType<OperationObject>>
  /** An object to hold reusable Message Objects. */
  messages?: Record<string, ReferenceType<MessageObject>>
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes?: Record<string, ReferenceType<SecuritySchemeObject>>
  /** An object to hold reusable Server Variable Objects. */
  serverVariables?: Record<string, ReferenceType<ServerVariableObject>>
  /** An object to hold reusable Parameter Objects. */
  parameters?: Record<string, ReferenceType<ParameterObject>>
  /** An object to hold reusable Correlation ID Objects. */
  correlationIds?: Record<string, ReferenceType<CorrelationIdObject>>
  /** An object to hold reusable Reply Objects. */
  replies?: Record<string, ReferenceType<ReplyObject>>
  /** An object to hold reusable Reply Address Objects. */
  replyAddresses?: Record<string, ReferenceType<ReplyAddressObject>>
  /** An object to hold reusable External Documentation Objects. */
  externalDocs?: Record<string, ReferenceType<ExternalDocumentationObject>>
  /** An object to hold reusable Tag Objects. */
  tags?: Record<string, ReferenceType<TagObject>>
  /** An object to hold reusable Operation Trait Objects. */
  operationTraits?: Record<string, ReferenceType<OperationTraitObject>>
  /** An object to hold reusable Message Trait Objects. */
  messageTraits?: Record<string, ReferenceType<MessageTraitObject>>
  /** An object to hold reusable Server Bindings Objects. */
  serverBindings?: Record<string, ReferenceType<ServerBindingsObject>>
  /** An object to hold reusable Channel Bindings Objects. */
  channelBindings?: Record<string, ReferenceType<ChannelBindingsObject>>
  /** An object to hold reusable Operation Bindings Objects. */
  operationBindings?: Record<string, ReferenceType<OperationBindingsObject>>
  /** An object to hold reusable Message Bindings Objects. */
  messageBindings?: Record<string, ReferenceType<MessageBindingsObject>>
}
