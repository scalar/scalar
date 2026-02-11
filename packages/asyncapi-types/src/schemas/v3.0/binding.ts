import { Type } from '@scalar/typebox'

import {
  Amqp1ChannelBindingRef,
  Amqp1ServerBindingRef,
  AmqpChannelBindingRef,
  AmqpMessageBindingRef,
  AmqpOperationBindingRef,
  AmqpServerBindingRef,
  AnypointMqChannelBindingRef,
  AnypointMqMessageBindingRef,
  AnypointMqServerBindingRef,
  GooglePubSubChannelBindingRef,
  GooglePubSubMessageBindingRef,
  HttpChannelBindingRef,
  HttpMessageBindingRef,
  HttpOperationBindingRef,
  HttpServerBindingRef,
  IbmMqChannelBindingRef,
  IbmMqMessageBindingRef,
  IbmMqServerBindingRef,
  JmsChannelBindingRef,
  JmsMessageBindingRef,
  JmsServerBindingRef,
  KafkaChannelBindingRef,
  KafkaMessageBindingRef,
  KafkaOperationBindingRef,
  KafkaServerBindingRef,
  MercureChannelBindingRef,
  MercureServerBindingRef,
  Mqtt5ChannelBindingRef,
  Mqtt5ServerBindingRef,
  MqttChannelBindingRef,
  MqttMessageBindingRef,
  MqttOperationBindingRef,
  MqttServerBindingRef,
  NatsChannelBindingRef,
  NatsOperationBindingRef,
  NatsServerBindingRef,
  PulsarChannelBindingRef,
  PulsarServerBindingRef,
  RedisChannelBindingRef,
  RedisServerBindingRef,
  SnsChannelBindingRef,
  SnsOperationBindingRef,
  SnsServerBindingRef,
  SolaceChannelBindingRef,
  SolaceOperationBindingRef,
  SolaceServerBindingRef,
  SqsChannelBindingRef,
  SqsOperationBindingRef,
  SqsServerBindingRef,
  StompChannelBindingRef,
  StompServerBindingRef,
  WebSocketChannelBindingRef,
  WebSocketServerBindingRef,
} from './ref-definitions'

/**
 * Base Binding Schema - Protocol-specific bindings.
 * A map where keys represent the protocol (http, ws, kafka, amqp, mqtt, etc.) and values are the protocol-specific binding information.
 */
const BindingBaseSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([
    // AMQP
    AmqpChannelBindingRef,
    AmqpOperationBindingRef,
    AmqpMessageBindingRef,
    // AMQP 1.0
    Amqp1ChannelBindingRef,
    // HTTP
    HttpChannelBindingRef,
    HttpOperationBindingRef,
    HttpMessageBindingRef,
    // WebSocket
    WebSocketChannelBindingRef,
    // Kafka
    KafkaServerBindingRef,
    KafkaChannelBindingRef,
    KafkaOperationBindingRef,
    KafkaMessageBindingRef,
    // MQTT
    MqttChannelBindingRef,
    MqttServerBindingRef,
    MqttOperationBindingRef,
    MqttMessageBindingRef,
    // MQTT5
    Mqtt5ChannelBindingRef,
    Mqtt5ServerBindingRef,
    // NATS
    NatsChannelBindingRef,
    NatsOperationBindingRef,
    // SNS
    SnsChannelBindingRef,
    SnsOperationBindingRef,
    // SQS
    SqsChannelBindingRef,
    SqsOperationBindingRef,
    // Google Pub/Sub
    GooglePubSubChannelBindingRef,
    GooglePubSubMessageBindingRef,
    // Anypoint MQ
    AnypointMqChannelBindingRef,
    AnypointMqMessageBindingRef,
    // IBM MQ
    IbmMqServerBindingRef,
    IbmMqChannelBindingRef,
    IbmMqMessageBindingRef,
    // JMS
    JmsServerBindingRef,
    JmsChannelBindingRef,
    JmsMessageBindingRef,
    // Pulsar
    PulsarServerBindingRef,
    PulsarChannelBindingRef,
    // Solace
    SolaceChannelBindingRef,
    SolaceServerBindingRef,
    SolaceOperationBindingRef,
    // STOMP
    StompChannelBindingRef,
    // Redis
    RedisChannelBindingRef,
    // Mercure
    MercureChannelBindingRef,
  ]),
)

/**
 * Server Bindings Object - Protocol-specific bindings for servers.
 * Map with fixed optional keys per AsyncAPI 3.0 (server bindings object).
 */
export const ServerBindingsObjectSchemaDefinition = Type.Object({
  /** Protocol-specific information for an HTTP server. */
  http: Type.Optional(HttpServerBindingRef),
  /** Protocol-specific information for a WebSockets server. */
  ws: Type.Optional(WebSocketServerBindingRef),
  /** Protocol-specific information for a Kafka server. */
  kafka: Type.Optional(KafkaServerBindingRef),
  /** Protocol-specific information for an Anypoint MQ server. */
  anypointmq: Type.Optional(AnypointMqServerBindingRef),
  /** Protocol-specific information for an AMQP 0-9-1 server. */
  amqp: Type.Optional(AmqpServerBindingRef),
  /** Protocol-specific information for an AMQP 1.0 server. */
  amqp1: Type.Optional(Amqp1ServerBindingRef),
  /** Protocol-specific information for an MQTT server. */
  mqtt: Type.Optional(MqttServerBindingRef),
  /** Protocol-specific information for an MQTT 5 server. */
  mqtt5: Type.Optional(Mqtt5ServerBindingRef),
  /** Protocol-specific information for a NATS server. */
  nats: Type.Optional(NatsServerBindingRef),
  /** Protocol-specific information for a JMS server. */
  jms: Type.Optional(JmsServerBindingRef),
  /** Protocol-specific information for an SNS server. */
  sns: Type.Optional(SnsServerBindingRef),
  /** Protocol-specific information for a Solace server. */
  solace: Type.Optional(SolaceServerBindingRef),
  /** Protocol-specific information for an SQS server. */
  sqs: Type.Optional(SqsServerBindingRef),
  /** Protocol-specific information for a STOMP server. */
  stomp: Type.Optional(StompServerBindingRef),
  /** Protocol-specific information for a Redis server. */
  redis: Type.Optional(RedisServerBindingRef),
  /** Protocol-specific information for a Mercure server. */
  mercure: Type.Optional(MercureServerBindingRef),
  /** Protocol-specific information for an IBM MQ server. */
  ibmmq: Type.Optional(IbmMqServerBindingRef),
  /** Protocol-specific information for a Pulsar server. */
  pulsar: Type.Optional(PulsarServerBindingRef),
})

/**
 * Channel Bindings Object - Protocol-specific bindings for channels.
 * Map with fixed optional keys per AsyncAPI 3.0 (channel bindings object).
 */
export const ChannelBindingsObjectSchemaDefinition = Type.Object({
  /** Protocol-specific information for an HTTP channel. */
  http: Type.Optional(HttpChannelBindingRef),
  /** Protocol-specific information for a WebSockets channel. */
  ws: Type.Optional(WebSocketChannelBindingRef),
  /** Protocol-specific information for a Kafka channel. */
  kafka: Type.Optional(KafkaChannelBindingRef),
  /** Protocol-specific information for an Anypoint MQ channel. */
  anypointmq: Type.Optional(AnypointMqChannelBindingRef),
  /** Protocol-specific information for an AMQP 0-9-1 channel. */
  amqp: Type.Optional(AmqpChannelBindingRef),
  /** Protocol-specific information for an AMQP 1.0 channel. */
  amqp1: Type.Optional(Amqp1ChannelBindingRef),
  /** Protocol-specific information for an MQTT channel. */
  mqtt: Type.Optional(MqttChannelBindingRef),
  /** Protocol-specific information for an MQTT 5 channel. */
  mqtt5: Type.Optional(Mqtt5ChannelBindingRef),
  /** Protocol-specific information for a NATS channel. */
  nats: Type.Optional(NatsChannelBindingRef),
  /** Protocol-specific information for a JMS channel. */
  jms: Type.Optional(JmsChannelBindingRef),
  /** Protocol-specific information for an SNS channel. */
  sns: Type.Optional(SnsChannelBindingRef),
  /** Protocol-specific information for a Solace channel. */
  solace: Type.Optional(SolaceChannelBindingRef),
  /** Protocol-specific information for an SQS channel. */
  sqs: Type.Optional(SqsChannelBindingRef),
  /** Protocol-specific information for a STOMP channel. */
  stomp: Type.Optional(StompChannelBindingRef),
  /** Protocol-specific information for a Redis channel. */
  redis: Type.Optional(RedisChannelBindingRef),
  /** Protocol-specific information for a Mercure channel. */
  mercure: Type.Optional(MercureChannelBindingRef),
  /** Protocol-specific information for an IBM MQ channel. */
  ibmmq: Type.Optional(IbmMqChannelBindingRef),
  /** Protocol-specific information for a Google Cloud Pub/Sub channel. */
  googlepubsub: Type.Optional(GooglePubSubChannelBindingRef),
  /** Protocol-specific information for a Pulsar channel. */
  pulsar: Type.Optional(PulsarChannelBindingRef),
})

/**
 * Operation Bindings Object - Protocol-specific bindings for operations.
 */
export const OperationBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition

/**
 * Message Bindings Object - Protocol-specific bindings for messages.
 */
export const MessageBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition
