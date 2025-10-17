// Export all AsyncAPI schemas
// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export {
  AmqpBindingSchema,
  type AsyncApiDocument,
  AsyncApiDocumentSchema,
  AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict,
  type AsyncApiExtensions,
  ChannelBindingsObjectSchema,
  ChannelObjectSchema,
  ChannelsObjectSchema,
  ComponentsObjectSchema,
  CorrelationIdObjectSchema,
  // Protocol-specific bindings
  HttpBindingSchema,
  KafkaBindingSchema,
  MessageBindingsObjectSchema,
  MessageExampleObjectSchema,
  MessageObjectSchema,
  MessageTraitObjectSchema,
  MessagesObjectSchema,
  MqttBindingSchema,
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
  // Binding object schemas
  ServerBindingsObjectSchema,
  // Export AsyncAPI-specific schemas from the module
  ServerObjectSchema,
  ServerVariableObjectSchema,
  ServersObjectSchema,
  TagsObjectSchema,
  WebSocketBindingSchema,
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
export type { AmqpBinding } from './bindings/amqp'
export type { HttpBinding } from './bindings/http'
export type { KafkaBinding } from './bindings/kafka'
export type { MqttBinding } from './bindings/mqtt'
export type { WebSocketBinding } from './bindings/websocket'
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
