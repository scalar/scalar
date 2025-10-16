import { Type } from '@scalar/typebox'

import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import { ExternalDocumentationObjectRef, SchemaObjectRef, TagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import type { ChannelItem } from './channel-item'
import type { CorrelationId } from './correlation-id'
import type { Message } from './message'
import type { MessageTrait } from './message-trait'
import type { Operation } from './operation'
import type { OperationTrait } from './operation-trait'
import type { Parameter } from './parameter'
import {
  BindingRef,
  ChannelItemRef,
  CorrelationIdRef,
  MessageRef,
  MessageTraitRef,
  OperationRef,
  OperationTraitRef,
  ParameterRef,
  ReplyAddressRef,
  ReplyRef,
  SecuritySchemeObjectRef,
  ServerRef,
  ServerVariableRef,
} from './ref-definitions'
import type { Reply } from './reply'
import type { ReplyAddress } from './reply-address'
import type { SecuritySchemeObject } from './security-scheme'
import type { Server, ServerVariable } from './server'

/**
 * Holds a set of reusable objects for different aspects of the AsyncAPI specification.
 * All objects defined within the components object will have no effect on the API unless they are explicitly referenced from outside the components object.
 */
export const ComponentsObjectSchemaDefinition = Type.Object({
  /** An object to hold reusable Schema Objects. */
  schemas: Type.Optional(Type.Record(Type.String(), Type.Union([SchemaObjectRef, reference(SchemaObjectRef)]))),
  /** An object to hold reusable Server Objects. */
  servers: Type.Optional(Type.Record(Type.String(), Type.Union([ServerRef, reference(ServerRef)]))),
  /** An object to hold reusable Channel Objects. */
  channels: Type.Optional(Type.Record(Type.String(), Type.Union([ChannelItemRef, reference(ChannelItemRef)]))),
  /** An object to hold reusable Operation Objects. */
  operations: Type.Optional(Type.Record(Type.String(), Type.Union([OperationRef, reference(OperationRef)]))),
  /** An object to hold reusable Message Objects. */
  messages: Type.Optional(Type.Record(Type.String(), Type.Union([MessageRef, reference(MessageRef)]))),
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes: Type.Optional(
    Type.Record(Type.String(), Type.Union([SecuritySchemeObjectRef, reference(SecuritySchemeObjectRef)])),
  ),
  /** An object to hold reusable Server Variable Objects. */
  serverVariables: Type.Optional(
    Type.Record(Type.String(), Type.Union([ServerVariableRef, reference(ServerVariableRef)])),
  ),
  /** An object to hold reusable Parameter Objects. */
  parameters: Type.Optional(Type.Record(Type.String(), Type.Union([ParameterRef, reference(ParameterRef)]))),
  /** An object to hold reusable Correlation ID Objects. */
  correlationIds: Type.Optional(
    Type.Record(Type.String(), Type.Union([CorrelationIdRef, reference(CorrelationIdRef)])),
  ),
  /** An object to hold reusable Reply Objects. */
  replies: Type.Optional(Type.Record(Type.String(), Type.Union([ReplyRef, reference(ReplyRef)]))),
  /** An object to hold reusable Reply Address Objects. */
  replyAddresses: Type.Optional(Type.Record(Type.String(), Type.Union([ReplyAddressRef, reference(ReplyAddressRef)]))),
  /** An object to hold reusable External Documentation Objects. */
  externalDocs: Type.Optional(
    Type.Record(Type.String(), Type.Union([ExternalDocumentationObjectRef, reference(ExternalDocumentationObjectRef)])),
  ),
  /** An object to hold reusable Tag Objects. */
  tags: Type.Optional(Type.Record(Type.String(), Type.Union([TagObjectRef, reference(TagObjectRef)]))),
  /** An object to hold reusable Operation Trait Objects. */
  operationTraits: Type.Optional(
    Type.Record(Type.String(), Type.Union([OperationTraitRef, reference(OperationTraitRef)])),
  ),
  /** An object to hold reusable Message Trait Objects. */
  messageTraits: Type.Optional(Type.Record(Type.String(), Type.Union([MessageTraitRef, reference(MessageTraitRef)]))),
  /** An object to hold reusable Server Bindings Objects. */
  serverBindings: Type.Optional(Type.Record(Type.String(), Type.Union([BindingRef, reference(BindingRef)]))),
  /** An object to hold reusable Channel Bindings Objects. */
  channelBindings: Type.Optional(Type.Record(Type.String(), Type.Union([BindingRef, reference(BindingRef)]))),
  /** An object to hold reusable Operation Bindings Objects. */
  operationBindings: Type.Optional(Type.Record(Type.String(), Type.Union([BindingRef, reference(BindingRef)]))),
  /** An object to hold reusable Message Bindings Objects. */
  messageBindings: Type.Optional(Type.Record(Type.String(), Type.Union([BindingRef, reference(BindingRef)]))),
})

/**
 * Holds a set of reusable objects for different aspects of the AsyncAPI specification.
 * All objects defined within the components object will have no effect on the API unless they are explicitly referenced from outside the components object.
 */
export type ComponentsObject = {
  /** An object to hold reusable Schema Objects. */
  schemas?: Record<string, ReferenceType<SchemaObject>>
  /** An object to hold reusable Server Objects. */
  servers?: Record<string, ReferenceType<Server>>
  /** An object to hold reusable Channel Objects. */
  channels?: Record<string, ReferenceType<ChannelItem>>
  /** An object to hold reusable Operation Objects. */
  operations?: Record<string, ReferenceType<Operation>>
  /** An object to hold reusable Message Objects. */
  messages?: Record<string, ReferenceType<Message>>
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes?: Record<string, ReferenceType<SecuritySchemeObject>>
  /** An object to hold reusable Server Variable Objects. */
  serverVariables?: Record<string, ReferenceType<ServerVariable>>
  /** An object to hold reusable Parameter Objects. */
  parameters?: Record<string, ReferenceType<Parameter>>
  /** An object to hold reusable Correlation ID Objects. */
  correlationIds?: Record<string, ReferenceType<CorrelationId>>
  /** An object to hold reusable Reply Objects. */
  replies?: Record<string, ReferenceType<Reply>>
  /** An object to hold reusable Reply Address Objects. */
  replyAddresses?: Record<string, ReferenceType<ReplyAddress>>
  /** An object to hold reusable External Documentation Objects. */
  externalDocs?: Record<string, ReferenceType<ExternalDocumentationObject>>
  /** An object to hold reusable Tag Objects. */
  tags?: Record<string, ReferenceType<TagObject>>
  /** An object to hold reusable Operation Trait Objects. */
  operationTraits?: Record<string, ReferenceType<OperationTrait>>
  /** An object to hold reusable Message Trait Objects. */
  messageTraits?: Record<string, ReferenceType<MessageTrait>>
  /** An object to hold reusable Server Bindings Objects. */
  serverBindings?: Record<string, ReferenceType<Record<string, any>>>
  /** An object to hold reusable Channel Bindings Objects. */
  channelBindings?: Record<string, ReferenceType<Record<string, any>>>
  /** An object to hold reusable Operation Bindings Objects. */
  operationBindings?: Record<string, ReferenceType<Record<string, any>>>
  /** An object to hold reusable Message Bindings Objects. */
  messageBindings?: Record<string, ReferenceType<Record<string, any>>>
}
