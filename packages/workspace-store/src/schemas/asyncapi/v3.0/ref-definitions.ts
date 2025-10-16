import { Type } from '@scalar/typebox'

/**
 * Reference definitions for AsyncAPI 3.0 objects.
 * These can be used with Type.Ref to create references to these objects in other schemas.
 *
 * Referencing them this way helps avoid circular dependencies in TypeBox schemas while keeping the overhead performance lower.
 */
export const ASYNCAPI_REF_DEFINITIONS = {
  // AsyncAPI-specific objects
  ChannelItem: 'ChannelItem',
  ChannelsObject: 'ChannelsObject',
  Operation: 'Operation',
  OperationsObject: 'OperationsObject',
  Message: 'Message',
  MessageTrait: 'MessageTrait',
  Parameter: 'Parameter',
  CorrelationId: 'CorrelationId',
  OperationTrait: 'OperationTrait',
  Reply: 'Reply',
  ReplyAddress: 'ReplyAddress',
  AsyncApiServer: 'AsyncApiServer',
  AsyncApiServerVariable: 'AsyncApiServerVariable',
  Binding: 'Binding',

  // Protocol-specific bindings
  HttpBinding: 'HttpBinding',
  WebSocketBinding: 'WebSocketBinding',
  KafkaBinding: 'KafkaBinding',
  AmqpBinding: 'AmqpBinding',
  MqttBinding: 'MqttBinding',

  // Multi-format schemas
  MultiFormatSchema: 'MultiFormatSchema',

  // Components
  AsyncApiComponentsObject: 'AsyncApiComponentsObject',

  // Object maps
  ServersObject: 'ServersObject',
  MessagesObject: 'MessagesObject',
} as const

// Type alias for schema references
export const ChannelItemRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ChannelItem)
export const ChannelsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ChannelsObject)
export const OperationRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Operation)
export const OperationsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OperationsObject)
export const MessageRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Message)
export const MessageTraitRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessageTrait)
export const ParameterRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Parameter)
export const CorrelationIdRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.CorrelationId)
export const OperationTraitRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OperationTrait)
export const ReplyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Reply)
export const ReplyAddressRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ReplyAddress)
export const AsyncApiServerRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AsyncApiServer)
export const AsyncApiServerVariableRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AsyncApiServerVariable)
export const BindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Binding)

// Protocol-specific binding references
export const HttpBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpBinding)
export const WebSocketBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.WebSocketBinding)
export const KafkaBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaBinding)
export const AmqpBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpBinding)
export const MqttBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttBinding)

// Multi-format schema reference
export const MultiFormatSchemaRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MultiFormatSchema)

// Components reference
export const AsyncApiComponentsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AsyncApiComponentsObject)

// Object map references
export const ServersObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ServersObject)
export const MessagesObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessagesObject)
