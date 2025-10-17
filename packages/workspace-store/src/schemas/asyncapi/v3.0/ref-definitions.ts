import { Type } from '@scalar/typebox'

/**
 * Reference definitions for AsyncAPI 3.0 objects.
 * These can be used with Type.Ref to create references to these objects in other schemas.
 *
 * Referencing them this way helps avoid circular dependencies in TypeBox schemas while keeping the overhead performance lower.
 */
export const ASYNCAPI_REF_DEFINITIONS = {
  // AsyncAPI-specific objects
  ChannelObject: 'ChannelObject',
  ChannelsObject: 'ChannelsObject',
  Operation: 'Operation',
  OperationsObject: 'OperationsObject',
  MessageObject: 'MessageObject',
  MessageTraitObject: 'MessageTraitObject',
  MessageExampleObject: 'MessageExampleObject',
  ParameterObject: 'ParameterObject',
  ParametersObject: 'ParametersObject',
  CorrelationIdObject: 'CorrelationIdObject',
  OperationTraitObject: 'OperationTraitObject',
  ReplyObject: 'ReplyObject',
  ReplyAddressObject: 'ReplyAddressObject',
  ServerObject: 'ServerObject',
  ServerVariableObject: 'ServerVariableObject',

  // Binding objects
  ServerBindingsObject: 'ServerBindingsObject',
  ChannelBindingsObject: 'ChannelBindingsObject',
  OperationBindingsObject: 'OperationBindingsObject',
  MessageBindingsObject: 'MessageBindingsObject',

  // Protocol-specific bindings
  HttpBinding: 'HttpBinding',
  WebSocketBinding: 'WebSocketBinding',
  KafkaBinding: 'KafkaBinding',
  AmqpBinding: 'AmqpBinding',
  MqttBinding: 'MqttBinding',

  // Multi-format schemas
  MultiFormatSchemaObject: 'MultiFormatSchemaObject',

  // Security
  SecuritySchemeObject: 'SecuritySchemeObject',
  OAuthFlowsObject: 'OAuthFlowsObject',
  OAuthFlowObject: 'OAuthFlowObject',

  // Components
  ComponentsObject: 'ComponentsObject',

  // Object maps
  ServersObject: 'ServersObject',
  MessagesObject: 'MessagesObject',
  TagsObject: 'TagsObject',
} as const

// Type alias for schema references
export const ChannelObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ChannelObject)
export const ChannelsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ChannelsObject)
export const OperationRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Operation)
export const OperationsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OperationsObject)
export const MessageObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessageObject)
export const MessageTraitObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessageTraitObject)
export const MessageExampleObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessageExampleObject)
export const ParameterObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ParameterObject)
export const ParametersObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ParametersObject)
export const CorrelationIdObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.CorrelationIdObject)
export const OperationTraitObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OperationTraitObject)
export const ReplyObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ReplyObject)
export const ReplyAddressObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ReplyAddressObject)
export const ServerObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ServerObject)
export const ServerVariableObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ServerVariableObject)

// Binding object references
export const ServerBindingsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ServerBindingsObject)
export const ChannelBindingsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ChannelBindingsObject)
export const OperationBindingsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OperationBindingsObject)
export const MessageBindingsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessageBindingsObject)

// Protocol-specific binding references
export const HttpBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpBinding)
export const WebSocketBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.WebSocketBinding)
export const KafkaBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaBinding)
export const AmqpBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpBinding)
export const MqttBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttBinding)

// Multi-format schema reference
export const MultiFormatSchemaObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MultiFormatSchemaObject)

// Security references
export const SecuritySchemeObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SecuritySchemeObject)
export const OAuthFlowsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OAuthFlowsObject)
export const OAuthFlowObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.OAuthFlowObject)

// Components reference
export const ComponentsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ComponentsObject)

// Object map references
export const ServersObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.ServersObject)
export const MessagesObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MessagesObject)
export const TagsObjectRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.TagsObject)

// Legacy aliases for backward compatibility (will be removed in future versions)
/** @deprecated Use ChannelObjectRef instead */
export const ChannelItemRef = ChannelObjectRef
/** @deprecated Use MessageObjectRef instead */
export const MessageRef = MessageObjectRef
/** @deprecated Use MessageTraitObjectRef instead */
export const MessageTraitRef = MessageTraitObjectRef
/** @deprecated Use MessageExampleObjectRef instead */
export const MessageExampleRef = MessageExampleObjectRef
/** @deprecated Use ParameterObjectRef instead */
export const ParameterRef = ParameterObjectRef
/** @deprecated Use CorrelationIdObjectRef instead */
export const CorrelationIdRef = CorrelationIdObjectRef
/** @deprecated Use OperationTraitObjectRef instead */
export const OperationTraitRef = OperationTraitObjectRef
/** @deprecated Use ReplyObjectRef instead */
export const ReplyRef = ReplyObjectRef
/** @deprecated Use ReplyAddressObjectRef instead */
export const ReplyAddressRef = ReplyAddressObjectRef
/** @deprecated Use ServerObjectRef instead */
export const ServerRef = ServerObjectRef
/** @deprecated Use ServerVariableObjectRef instead */
export const ServerVariableRef = ServerVariableObjectRef
/** @deprecated Use MultiFormatSchemaObjectRef instead */
export const MultiFormatSchemaRef = MultiFormatSchemaObjectRef
/** @deprecated Use specific binding object refs instead */
export const BindingRef = ServerBindingsObjectRef
