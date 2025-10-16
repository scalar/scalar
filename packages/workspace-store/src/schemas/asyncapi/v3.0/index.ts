// Export all AsyncAPI schemas
// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export {
  AmqpBindingSchema,
  AsyncApiComponentsObjectSchema,
  type AsyncApiDocument,
  AsyncApiDocumentSchema,
  AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict,
  type AsyncApiExtensions,
  // Export AsyncAPI-specific schemas from the module
  AsyncApiServerSchema,
  AsyncApiServerVariableSchema,
  BindingSchema,
  ChannelItemSchema,
  ChannelsObjectSchema,
  CorrelationIdSchema,
  // Protocol-specific bindings
  HttpBindingSchema,
  KafkaBindingSchema,
  MessageSchema,
  MessageTraitSchema,
  MessagesObjectSchema,
  MqttBindingSchema,
  MultiFormatSchemaSchema,
  OperationSchema,
  OperationTraitSchema,
  OperationsObjectSchema,
  ParameterSchema,
  ReplyAddressSchema,
  ReplySchema,
  ServersObjectSchema,
  WebSocketBindingSchema,
} from './asyncapi-document'
// Export types from individual files
export type { Binding } from './binding'
export type { AmqpBinding } from './bindings/amqp'
export type { HttpBinding } from './bindings/http'
export type { KafkaBinding } from './bindings/kafka'
export type { MqttBinding } from './bindings/mqtt'
export type { WebSocketBinding } from './bindings/websocket'
export type { ChannelItem } from './channel-item'
export type { ChannelsObject } from './channels'
export type { AsyncApiComponentsObject } from './components'
export type { CorrelationId } from './correlation-id'
export type { Message } from './message'
export type { MessageTrait } from './message-trait'
export type { MessagesObject } from './messages'
export type { MultiFormatSchema } from './multi-format-schema'
export type { Operation, OperationAction } from './operation'
export type { OperationTrait } from './operation-trait'
export type { OperationsObject } from './operations'
export type { Parameter } from './parameter'
// Export reference definitions
export { ASYNCAPI_REF_DEFINITIONS } from './ref-definitions'
export type { Reply } from './reply'
export type { ReplyAddress } from './reply-address'
export type { Server, ServerVariable } from './server'
export type { ServersObject } from './servers'
