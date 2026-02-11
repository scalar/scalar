import { Type } from '@scalar/typebox'

import {
  ExternalDocumentationObjectRef,
  SchemaObjectRef,
  TagObjectRef,
} from '@/openapi-types/v3.1/strict/ref-definitions'
import { reference } from '@/openapi-types/v3.1/strict/reference'

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
