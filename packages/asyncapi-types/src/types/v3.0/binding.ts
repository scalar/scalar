import type { AmqpChannelBinding, AmqpServerBinding } from './bindings/amqp'
import type { Amqp1ChannelBinding, Amqp1ServerBinding } from './bindings/amqp1'
import type { AnypointMqChannelBinding, AnypointMqServerBinding } from './bindings/anypointmq'
import type { GooglePubSubChannelBinding } from './bindings/googlepubsub'
import type { HttpChannelBinding, HttpServerBinding } from './bindings/http'
import type { IbmMqChannelBinding, IbmMqServerBinding } from './bindings/ibmmq'
import type { JmsChannelBinding, JmsServerBinding } from './bindings/jms'
import type { KafkaChannelBinding, KafkaServerBinding } from './bindings/kafka'
import type { MercureChannelBinding, MercureServerBinding } from './bindings/mercure'
import type { MqttChannelBinding, MqttServerBinding } from './bindings/mqtt'
import type { Mqtt5ChannelBinding, Mqtt5ServerBinding } from './bindings/mqtt5'
import type { NatsChannelBinding, NatsServerBinding } from './bindings/nats'
import type { PulsarChannelBinding, PulsarServerBinding } from './bindings/pulsar'
import type { RedisChannelBinding, RedisServerBinding } from './bindings/redis'
import type { SnsChannelBinding, SnsServerBinding } from './bindings/sns'
import type { SolaceChannelBinding, SolaceServerBinding } from './bindings/solace'
import type { SqsChannelBinding, SqsServerBinding } from './bindings/sqs'
import type { StompChannelBinding, StompServerBinding } from './bindings/stomp'
import type { WebSocketChannelBinding, WebSocketServerBinding } from './bindings/websocket'

/**
 * Server Bindings Object - Protocol-specific bindings for servers.
 */
export type ServerBindingsObject = {
  /** Protocol-specific information for an HTTP server. */
  http?: HttpServerBinding
  /** Protocol-specific information for a WebSockets server. */
  ws?: WebSocketServerBinding
  /** Protocol-specific information for a Kafka server. */
  kafka?: KafkaServerBinding
  /** Protocol-specific information for an Anypoint MQ server. */
  anypointmq?: AnypointMqServerBinding
  /** Protocol-specific information for an AMQP 0-9-1 server. */
  amqp?: AmqpServerBinding
  /** Protocol-specific information for an AMQP 1.0 server. */
  amqp1?: Amqp1ServerBinding
  /** Protocol-specific information for an MQTT server. */
  mqtt?: MqttServerBinding
  /** Protocol-specific information for an MQTT 5 server. */
  mqtt5?: Mqtt5ServerBinding
  /** Protocol-specific information for a NATS server. */
  nats?: NatsServerBinding
  /** Protocol-specific information for a JMS server. */
  jms?: JmsServerBinding
  /** Protocol-specific information for an SNS server. */
  sns?: SnsServerBinding
  /** Protocol-specific information for a Solace server. */
  solace?: SolaceServerBinding
  /** Protocol-specific information for an SQS server. */
  sqs?: SqsServerBinding
  /** Protocol-specific information for a STOMP server. */
  stomp?: StompServerBinding
  /** Protocol-specific information for a Redis server. */
  redis?: RedisServerBinding
  /** Protocol-specific information for a Mercure server. */
  mercure?: MercureServerBinding
  /** Protocol-specific information for an IBM MQ server. */
  ibmmq?: IbmMqServerBinding
  /** Protocol-specific information for a Pulsar server. */
  pulsar?: PulsarServerBinding
}

/**
 * Channel Bindings Object - Protocol-specific bindings for channels.
 * Map describing protocol-specific definitions for a channel (AsyncAPI 3.0 fixed fields).
 */
export type ChannelBindingsObject = {
  /** Protocol-specific information for an HTTP channel. */
  http?: HttpChannelBinding
  /** Protocol-specific information for a WebSockets channel. */
  ws?: WebSocketChannelBinding
  /** Protocol-specific information for a Kafka channel. */
  kafka?: KafkaChannelBinding
  /** Protocol-specific information for an Anypoint MQ channel. */
  anypointmq?: AnypointMqChannelBinding
  /** Protocol-specific information for an AMQP 0-9-1 channel. */
  amqp?: AmqpChannelBinding
  /** Protocol-specific information for an AMQP 1.0 channel. */
  amqp1?: Amqp1ChannelBinding
  /** Protocol-specific information for an MQTT channel. */
  mqtt?: MqttChannelBinding
  /** Protocol-specific information for an MQTT 5 channel. */
  mqtt5?: Mqtt5ChannelBinding
  /** Protocol-specific information for a NATS channel. */
  nats?: NatsChannelBinding
  /** Protocol-specific information for a JMS channel. */
  jms?: JmsChannelBinding
  /** Protocol-specific information for an SNS channel. */
  sns?: SnsChannelBinding
  /** Protocol-specific information for a Solace channel. */
  solace?: SolaceChannelBinding
  /** Protocol-specific information for an SQS channel. */
  sqs?: SqsChannelBinding
  /** Protocol-specific information for a STOMP channel. */
  stomp?: StompChannelBinding
  /** Protocol-specific information for a Redis channel. */
  redis?: RedisChannelBinding
  /** Protocol-specific information for a Mercure channel. */
  mercure?: MercureChannelBinding
  /** Protocol-specific information for an IBM MQ channel. */
  ibmmq?: IbmMqChannelBinding
  /** Protocol-specific information for a Google Cloud Pub/Sub channel. */
  googlepubsub?: GooglePubSubChannelBinding
  /** Protocol-specific information for a Pulsar channel. */
  pulsar?: PulsarChannelBinding
}

/**
 * Operation Bindings Object - Protocol-specific bindings for operations.
 */
export type OperationBindingsObject = {
  /** Protocol-specific binding information for operations. */
  [key: string]: any
}

/**
 * Message Bindings Object - Protocol-specific bindings for messages.
 */
export type MessageBindingsObject = {
  /** Protocol-specific binding information for messages. */
  [key: string]: any
}
