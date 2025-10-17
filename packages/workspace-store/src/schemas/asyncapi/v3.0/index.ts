// Export all AsyncAPI schemas
// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export {
  // Protocol-specific binding schemas - AMQP
  AmqpChannelBindingSchema,
  AmqpMessageBindingSchema,
  AmqpOperationBindingSchema,
  type AsyncApiDocument,
  AsyncApiDocumentSchema,
  AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict,
  type AsyncApiExtensions,
  // Binding object schemas
  ChannelBindingsObjectSchema,
  ChannelObjectSchema,
  ChannelsObjectSchema,
  ComponentsObjectSchema,
  CorrelationIdObjectSchema,
  // Protocol-specific binding schemas - HTTP
  HttpMessageBindingSchema,
  HttpOperationBindingSchema,
  // Protocol-specific binding schemas - Kafka
  KafkaChannelBindingSchema,
  KafkaMessageBindingSchema,
  KafkaOperationBindingSchema,
  KafkaServerBindingSchema,
  MessageBindingsObjectSchema,
  MessageExampleObjectSchema,
  MessageObjectSchema,
  MessageTraitObjectSchema,
  MessagesObjectSchema,
  // Protocol-specific binding schemas - MQTT
  MqttMessageBindingSchema,
  MqttOperationBindingSchema,
  MqttServerBindingSchema,
  MultiFormatSchemaObjectSchema,
  OAuthFlowObjectSchema,
  OAuthFlowsObjectSchema,
  OperationBindingsObjectSchema,
  OperationSchema,
  OperationTraitObjectSchema,
  OperationsObjectSchema,
  ParameterObjectSchema,
  // Object map schemas
  ParametersObjectSchema,
  ReplyAddressObjectSchema,
  ReplyObjectSchema,
  SecuritySchemeObjectSchema,
  ServerBindingsObjectSchema,
  // Export AsyncAPI-specific schemas from the module
  ServerObjectSchema,
  ServerVariableObjectSchema,
  ServersObjectSchema,
  TagsObjectSchema,
  // Protocol-specific binding schemas - WebSocket
  WebSocketChannelBindingSchema,
} from './asyncapi-document'
// Export types from individual files
export type {
  /** @deprecated Use specific binding object types instead */
  Binding,
  ChannelBindingsObject,
  MessageBindingsObject,
  OperationBindingsObject,
  ServerBindingsObject,
} from './binding'
export type {
  AmqpChannelBinding,
  AmqpMessageBinding,
  AmqpOperationBinding,
} from './bindings/amqp'
export type { HttpMessageBinding, HttpOperationBinding } from './bindings/http'
export type {
  KafkaChannelBinding,
  KafkaMessageBinding,
  KafkaOperationBinding,
  KafkaServerBinding,
} from './bindings/kafka'
export type { MqttMessageBinding, MqttOperationBinding, MqttServerBinding } from './bindings/mqtt'
export type { WebSocketChannelBinding } from './bindings/websocket'
export type { ChannelObject } from './channel-item'
export type { ChannelsObject } from './channels'
export type { ComponentsObject } from './components'
export type { CorrelationIdObject } from './correlation-id'
export type { MessageObject } from './message'
export type { MessageExampleObject } from './message-example'
export type { MessageTraitObject } from './message-trait'
export type { MessagesObject } from './messages'
export type { MultiFormatSchemaObject } from './multi-format-schema'
export type {
  OAuthFlowAuthorizationCodeObject,
  OAuthFlowClientCredentialsObject,
  OAuthFlowImplicitObject,
  OAuthFlowObject,
  OAuthFlowPasswordObject,
} from './oauth-flow'
export type { OAuthFlowsObject } from './oauth-flows'
export type { OperationAction, OperationObject } from './operation'
export type { OperationTraitObject } from './operation-trait'
export type { OperationsObject } from './operations'
export type { ParameterObject } from './parameter'
export type { ParametersObject } from './parameters'
// Export reference definitions
export { ASYNCAPI_REF_DEFINITIONS } from './ref-definitions'
export type { ReplyObject } from './reply'
export type { ReplyAddressObject } from './reply-address'
export type {
  ApiKeyObject,
  AsymmetricEncryptionObject,
  GssapiObject,
  HttpApiKeyObject,
  HttpObject,
  OAuth2Object,
  OpenIdConnectObject,
  PlainObject,
  ScramSha256Object,
  ScramSha512Object,
  SecuritySchemeObject,
  SymmetricEncryptionObject,
  UserPasswordObject,
  X509Object,
} from './security-scheme'
export type { ServerObject, ServerVariableObject } from './server'
export type { ServersObject } from './servers'
export type { TagsObject } from './tags'
