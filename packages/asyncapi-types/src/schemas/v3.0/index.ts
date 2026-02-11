// Export all AsyncAPI schemas
// Export strict validation schema for AsyncAPI 3.0 (same as regular schema for now)
export {
  // Protocol-specific binding schemas - AMQP
  AmqpChannelBindingSchema,
  AmqpMessageBindingSchema,
  AmqpOperationBindingSchema,
  AsyncApiDocumentSchema,
  AsyncApiDocumentSchema as AsyncApiDocumentSchemaStrict,
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
