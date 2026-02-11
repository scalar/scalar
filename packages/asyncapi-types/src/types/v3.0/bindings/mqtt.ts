import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

/**
 * Last Will and Testament configuration for MQTT.
 */
export type LastWill = {
  /** The topic where the Last Will and Testament message will be sent. */
  topic?: string
  /** Defines how hard the broker/client will try to ensure that the Last Will and Testament message is received. Its value MUST be either 0, 1 or 2. */
  qos?: 0 | 1 | 2
  /** Last Will message. */
  message?: string
  /** Whether the broker should retain the Last Will and Testament message or not. */
  retain?: boolean
}

/**
 * Protocol-specific information for an MQTT server.
 */
export type MqttServerBinding = {
  /** The client identifier. */
  clientId?: string
  /** Whether to create a persistent connection or not. When false, the connection will be persistent. This is called clean start in MQTTv5. */
  cleanSession?: boolean
  /** Last Will and Testament configuration. */
  lastWill?: LastWill
  /** Interval in seconds of the longest period of time the broker and the client can endure without sending a message. */
  keepAlive?: number
  /** Interval in seconds or a Schema Object containing the definition of the interval. The broker maintains a session for a disconnected client until this interval expires. */
  sessionExpiryInterval?: number | SchemaObject
  /** Number of bytes or a Schema Object representing the maximum packet size the client is willing to accept. */
  maximumPacketSize?: number | SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an MQTT operation.
 */
export type MqttOperationBinding = {
  /** Defines the Quality of Service (QoS) levels for the message flow. Its value MUST be either 0 (At most once delivery), 1 (At least once delivery), or 2 (Exactly once delivery). */
  qos?: 0 | 1 | 2
  /** Whether the broker should retain the message or not. */
  retain?: boolean
  /** Interval in seconds or a Schema Object containing the definition of the lifetime of the message. */
  messageExpiryInterval?: number | SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an MQTT message.
 */
export type MqttMessageBinding = {
  /** Either 0 (zero): Indicates that the payload is unspecified bytes, or 1: Indicates that the payload is UTF-8 encoded character data. */
  payloadFormatIndicator?: 0 | 1
  /** Correlation Data is used by the sender of the request message to identify which request the response message is for when it is received. */
  correlationData?: SchemaObject
  /** String describing the content type of the message payload. This should not conflict with the contentType field of the associated AsyncAPI Message object. */
  contentType?: string
  /** The topic (channel URI) for a response message. */
  responseTopic?: string | SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
