// Export all AsyncAPI schemas
export {
  AsyncApiDocumentSchema,
  type AsyncApiDocument,
  type AsyncApiExtensions,
} from './asyncapi-document'
export { ChannelItemSchema, type ChannelItem } from './channel-item'
export { ChannelsObjectSchema, type ChannelsObject } from './channels'
export { MessageSchema, type Message } from './message'
export {
  OperationSchema,
  type Operation,
  type OperationAction,
} from './operation'
export { OperationsObjectSchema, type OperationsObject } from './operations'
export {
  ServerSchema,
  ServerVariableSchema,
  type Server,
  type ServerVariable,
} from './server'

// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export { AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict } from './asyncapi-document'
