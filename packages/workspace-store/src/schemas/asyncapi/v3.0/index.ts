// Export all AsyncAPI schemas
// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export {
  type AsyncApiDocument,
  AsyncApiDocumentSchema,
  AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict,
  type AsyncApiExtensions,
} from './asyncapi-document'
// Export new AsyncAPI-specific schemas
export { type Binding, BindingSchema } from './binding'
export { type ChannelItem, ChannelItemSchema } from './channel-item'
export { type ChannelsObject, ChannelsObjectSchema } from './channels'
export { type CorrelationId, CorrelationIdSchema } from './correlation-id'
export { type Message, MessageSchema } from './message'
export { type MessageTrait, MessageTraitSchema } from './message-trait'
export {
  type Operation,
  type OperationAction,
  OperationSchema,
} from './operation'
export { type OperationTrait, OperationTraitSchema } from './operation-trait'
export { type OperationsObject, OperationsObjectSchema } from './operations'
export { type Parameter, ParameterSchema } from './parameter'
export { type Reply, ReplySchema } from './reply'
export {
  type Server,
  ServerSchema,
  type ServerVariable,
  ServerVariableSchema,
} from './server'
