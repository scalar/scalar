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
  // AMQP
  AmqpChannelBinding: 'AmqpChannelBinding',
  AmqpOperationBinding: 'AmqpOperationBinding',
  AmqpMessageBinding: 'AmqpMessageBinding',
  AmqpServerBinding: 'AmqpServerBinding',
  // AMQP 1.0
  Amqp1ChannelBinding: 'Amqp1ChannelBinding',
  Amqp1ServerBinding: 'Amqp1ServerBinding',
  // HTTP
  HttpChannelBinding: 'HttpChannelBinding',
  HttpOperationBinding: 'HttpOperationBinding',
  HttpMessageBinding: 'HttpMessageBinding',
  HttpServerBinding: 'HttpServerBinding',
  // WebSocket
  WebSocketChannelBinding: 'WebSocketChannelBinding',
  WebSocketServerBinding: 'WebSocketServerBinding',
  // Kafka
  KafkaServerBinding: 'KafkaServerBinding',
  KafkaChannelBinding: 'KafkaChannelBinding',
  KafkaOperationBinding: 'KafkaOperationBinding',
  KafkaMessageBinding: 'KafkaMessageBinding',
  // MQTT
  MqttChannelBinding: 'MqttChannelBinding',
  MqttServerBinding: 'MqttServerBinding',
  MqttOperationBinding: 'MqttOperationBinding',
  MqttMessageBinding: 'MqttMessageBinding',
  // MQTT5
  Mqtt5ChannelBinding: 'Mqtt5ChannelBinding',
  Mqtt5ServerBinding: 'Mqtt5ServerBinding',
  // NATS
  NatsChannelBinding: 'NatsChannelBinding',
  NatsOperationBinding: 'NatsOperationBinding',
  NatsServerBinding: 'NatsServerBinding',
  // SNS
  SnsChannelBinding: 'SnsChannelBinding',
  SnsOperationBinding: 'SnsOperationBinding',
  SnsServerBinding: 'SnsServerBinding',
  // SQS
  SqsChannelBinding: 'SqsChannelBinding',
  SqsOperationBinding: 'SqsOperationBinding',
  SqsServerBinding: 'SqsServerBinding',
  // Google Pub/Sub
  GooglePubSubChannelBinding: 'GooglePubSubChannelBinding',
  GooglePubSubMessageBinding: 'GooglePubSubMessageBinding',
  // Anypoint MQ
  AnypointMqChannelBinding: 'AnypointMqChannelBinding',
  AnypointMqMessageBinding: 'AnypointMqMessageBinding',
  AnypointMqServerBinding: 'AnypointMqServerBinding',
  // IBM MQ
  IbmMqServerBinding: 'IbmMqServerBinding',
  IbmMqChannelBinding: 'IbmMqChannelBinding',
  IbmMqMessageBinding: 'IbmMqMessageBinding',
  // JMS
  JmsServerBinding: 'JmsServerBinding',
  JmsChannelBinding: 'JmsChannelBinding',
  JmsMessageBinding: 'JmsMessageBinding',
  // Pulsar
  PulsarServerBinding: 'PulsarServerBinding',
  PulsarChannelBinding: 'PulsarChannelBinding',
  // Solace
  SolaceChannelBinding: 'SolaceChannelBinding',
  SolaceServerBinding: 'SolaceServerBinding',
  SolaceOperationBinding: 'SolaceOperationBinding',
  // STOMP
  StompChannelBinding: 'StompChannelBinding',
  StompServerBinding: 'StompServerBinding',
  // Redis
  RedisChannelBinding: 'RedisChannelBinding',
  RedisServerBinding: 'RedisServerBinding',
  // Mercure
  MercureChannelBinding: 'MercureChannelBinding',
  MercureServerBinding: 'MercureServerBinding',

  // Nested schema objects
  // AMQP
  AmqpExchange: 'AmqpExchange',
  AmqpQueue: 'AmqpQueue',
  // SQS
  SqsIdentifier: 'SqsIdentifier',
  SqsStatement: 'SqsStatement',
  SqsPolicy: 'SqsPolicy',
  SqsRedrivePolicy: 'SqsRedrivePolicy',
  SqsQueue: 'SqsQueue',
  // SNS
  SnsOrdering: 'SnsOrdering',
  SnsStatement: 'SnsStatement',
  SnsPolicy: 'SnsPolicy',
  SnsIdentifier: 'SnsIdentifier',
  SnsRedrivePolicy: 'SnsRedrivePolicy',
  SnsDeliveryPolicy: 'SnsDeliveryPolicy',
  SnsConsumer: 'SnsConsumer',
  // MQTT
  MqttLastWill: 'MqttLastWill',
  // Kafka
  KafkaTopicConfiguration: 'KafkaTopicConfiguration',
  // IBM MQ
  IbmMqQueue: 'IbmMqQueue',
  IbmMqTopic: 'IbmMqTopic',
  // Pulsar
  PulsarRetentionDefinition: 'PulsarRetentionDefinition',
  // Google Pub/Sub
  GooglePubSubMessageStoragePolicy: 'GooglePubSubMessageStoragePolicy',
  GooglePubSubSchemaSettings: 'GooglePubSubSchemaSettings',
  GooglePubSubSchemaDefinition: 'GooglePubSubSchemaDefinition',

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
// AMQP
export const AmqpChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpChannelBinding)
export const AmqpOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpOperationBinding)
export const AmqpMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpMessageBinding)
export const AmqpServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpServerBinding)
// AMQP 1.0
export const Amqp1ChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Amqp1ChannelBinding)
export const Amqp1ServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Amqp1ServerBinding)
// HTTP
export const HttpChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpChannelBinding)
export const HttpOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpOperationBinding)
export const HttpMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpMessageBinding)
export const HttpServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.HttpServerBinding)
// WebSocket
export const WebSocketChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.WebSocketChannelBinding)
export const WebSocketServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.WebSocketServerBinding)
// Kafka
export const KafkaServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaServerBinding)
export const KafkaChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaChannelBinding)
export const KafkaOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaOperationBinding)
export const KafkaMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaMessageBinding)
// MQTT
export const MqttChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttChannelBinding)
export const MqttServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttServerBinding)
export const MqttOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttOperationBinding)
export const MqttMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttMessageBinding)
// MQTT5
export const Mqtt5ChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Mqtt5ChannelBinding)
export const Mqtt5ServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.Mqtt5ServerBinding)
// NATS
export const NatsChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.NatsChannelBinding)
export const NatsOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.NatsOperationBinding)
export const NatsServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.NatsServerBinding)
// SNS
export const SnsChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsChannelBinding)
export const SnsOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsOperationBinding)
export const SnsServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsServerBinding)
// SQS
export const SqsChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsChannelBinding)
export const SqsOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsOperationBinding)
export const SqsServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsServerBinding)
// Google Pub/Sub
export const GooglePubSubChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.GooglePubSubChannelBinding)
export const GooglePubSubMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.GooglePubSubMessageBinding)
// Anypoint MQ
export const AnypointMqChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AnypointMqChannelBinding)
export const AnypointMqMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AnypointMqMessageBinding)
export const AnypointMqServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AnypointMqServerBinding)
// IBM MQ
export const IbmMqServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.IbmMqServerBinding)
export const IbmMqChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.IbmMqChannelBinding)
export const IbmMqMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.IbmMqMessageBinding)
// JMS
export const JmsServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.JmsServerBinding)
export const JmsChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.JmsChannelBinding)
export const JmsMessageBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.JmsMessageBinding)
// Pulsar
export const PulsarServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.PulsarServerBinding)
export const PulsarChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.PulsarChannelBinding)
// Solace
export const SolaceChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SolaceChannelBinding)
export const SolaceServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SolaceServerBinding)
export const SolaceOperationBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SolaceOperationBinding)
// STOMP
export const StompChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.StompChannelBinding)
export const StompServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.StompServerBinding)
// Redis
export const RedisChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.RedisChannelBinding)
export const RedisServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.RedisServerBinding)
// Mercure
export const MercureChannelBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MercureChannelBinding)
export const MercureServerBindingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MercureServerBinding)

// Nested schema object references
// AMQP
export const AmqpExchangeRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpExchange)
export const AmqpQueueRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.AmqpQueue)
// SQS
export const SqsIdentifierRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsIdentifier)
export const SqsStatementRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsStatement)
export const SqsPolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsPolicy)
export const SqsRedrivePolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsRedrivePolicy)
export const SqsQueueRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SqsQueue)
// SNS
export const SnsOrderingRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsOrdering)
export const SnsStatementRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsStatement)
export const SnsPolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsPolicy)
export const SnsIdentifierRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsIdentifier)
export const SnsRedrivePolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsRedrivePolicy)
export const SnsDeliveryPolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsDeliveryPolicy)
export const SnsConsumerRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.SnsConsumer)
// MQTT
export const MqttLastWillRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.MqttLastWill)
// Kafka
export const KafkaTopicConfigurationRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.KafkaTopicConfiguration)
// IBM MQ
export const IbmMqQueueRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.IbmMqQueue)
export const IbmMqTopicRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.IbmMqTopic)
// Pulsar
export const PulsarRetentionDefinitionRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.PulsarRetentionDefinition)
// Google Pub/Sub
export const GooglePubSubMessageStoragePolicyRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.GooglePubSubMessageStoragePolicy)
export const GooglePubSubSchemaSettingsRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.GooglePubSubSchemaSettings)
export const GooglePubSubSchemaDefinitionRef = Type.Ref(ASYNCAPI_REF_DEFINITIONS.GooglePubSubSchemaDefinition)

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
