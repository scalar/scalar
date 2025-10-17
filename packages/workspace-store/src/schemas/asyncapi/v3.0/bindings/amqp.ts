import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for an AMQP 0-9-1 channel.
 */
export const AmqpChannelBindingSchemaDefinition = Type.Object({
  /** Defines what type of channel is it. Can be either queue or routingKey (default). */
  is: Type.Optional(Type.Union([Type.Literal('queue'), Type.Literal('routingKey')])),
  /** When is=routingKey, this object defines the exchange properties. */
  exchange: Type.Optional(
    Type.Object({
      /** The name of the exchange. It MUST NOT exceed 255 characters long. */
      name: Type.Optional(Type.String({ maxLength: 255 })),
      /** The type of the exchange. Can be either topic, direct, fanout, default or headers. */
      type: Type.Optional(
        Type.Union([
          Type.Literal('topic'),
          Type.Literal('direct'),
          Type.Literal('fanout'),
          Type.Literal('default'),
          Type.Literal('headers'),
        ]),
      ),
      /** Whether the exchange should survive broker restarts or not. */
      durable: Type.Optional(Type.Boolean()),
      /** Whether the exchange should be deleted when the last queue is unbound from it. */
      autoDelete: Type.Optional(Type.Boolean()),
      /** The virtual host of the exchange. Defaults to /. */
      vhost: Type.Optional(Type.String()),
    }),
  ),
  /** When is=queue, this object defines the queue properties. */
  queue: Type.Optional(
    Type.Object({
      /** The name of the queue. It MUST NOT exceed 255 characters long. */
      name: Type.Optional(Type.String({ maxLength: 255 })),
      /** Whether the queue should survive broker restarts or not. */
      durable: Type.Optional(Type.Boolean()),
      /** Whether the queue should be used only by one connection or not. */
      exclusive: Type.Optional(Type.Boolean()),
      /** Whether the queue should be deleted when the last consumer unsubscribes. */
      autoDelete: Type.Optional(Type.Boolean()),
      /** The virtual host of the queue. Defaults to /. */
      vhost: Type.Optional(Type.String()),
    }),
  ),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an AMQP 0-9-1 channel.
 */
export type AmqpChannelBinding = {
  /** Defines what type of channel is it. Can be either queue or routingKey (default). */
  is?: 'queue' | 'routingKey'
  /** When is=routingKey, this object defines the exchange properties. */
  exchange?: {
    /** The name of the exchange. It MUST NOT exceed 255 characters long. */
    name?: string
    /** The type of the exchange. Can be either topic, direct, fanout, default or headers. */
    type?: 'topic' | 'direct' | 'fanout' | 'default' | 'headers'
    /** Whether the exchange should survive broker restarts or not. */
    durable?: boolean
    /** Whether the exchange should be deleted when the last queue is unbound from it. */
    autoDelete?: boolean
    /** The virtual host of the exchange. Defaults to /. */
    vhost?: string
  }
  /** When is=queue, this object defines the queue properties. */
  queue?: {
    /** The name of the queue. It MUST NOT exceed 255 characters long. */
    name?: string
    /** Whether the queue should survive broker restarts or not. */
    durable?: boolean
    /** Whether the queue should be used only by one connection or not. */
    exclusive?: boolean
    /** Whether the queue should be deleted when the last consumer unsubscribes. */
    autoDelete?: boolean
    /** The virtual host of the queue. Defaults to /. */
    vhost?: string
  }
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an AMQP 0-9-1 operation.
 */
export const AmqpOperationBindingSchemaDefinition = Type.Object({
  /** TTL (Time-To-Live) for the message. It MUST be greater than or equal to zero. */
  expiration: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Identifies the user who has sent the message. */
  userId: Type.Optional(Type.String()),
  /** The routing keys the message should be routed to at the time of publishing. */
  cc: Type.Optional(Type.Array(Type.String())),
  /** A priority for the message. */
  priority: Type.Optional(Type.Integer()),
  /** Delivery mode of the message. Its value MUST be either 1 (transient) or 2 (persistent). */
  deliveryMode: Type.Optional(Type.Union([Type.Literal(1), Type.Literal(2)])),
  /** Whether the message is mandatory or not. */
  mandatory: Type.Optional(Type.Boolean()),
  /** Like cc but consumers will not receive this information. */
  bcc: Type.Optional(Type.Array(Type.String())),
  /** Whether the message should include a timestamp or not. */
  timestamp: Type.Optional(Type.Boolean()),
  /** Whether the consumer should ack the message or not. */
  ack: Type.Optional(Type.Boolean()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an AMQP 0-9-1 operation.
 */
export type AmqpOperationBinding = {
  /** TTL (Time-To-Live) for the message. It MUST be greater than or equal to zero. */
  expiration?: number
  /** Identifies the user who has sent the message. */
  userId?: string
  /** The routing keys the message should be routed to at the time of publishing. */
  cc?: string[]
  /** A priority for the message. */
  priority?: number
  /** Delivery mode of the message. Its value MUST be either 1 (transient) or 2 (persistent). */
  deliveryMode?: 1 | 2
  /** Whether the message is mandatory or not. */
  mandatory?: boolean
  /** Like cc but consumers will not receive this information. */
  bcc?: string[]
  /** Whether the message should include a timestamp or not. */
  timestamp?: boolean
  /** Whether the consumer should ack the message or not. */
  ack?: boolean
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an AMQP 0-9-1 message.
 */
export const AmqpMessageBindingSchemaDefinition = Type.Object({
  /** A MIME encoding for the message content. */
  contentEncoding: Type.Optional(Type.String()),
  /** Application-specific message type. */
  messageType: Type.Optional(Type.String()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an AMQP 0-9-1 message.
 */
export type AmqpMessageBinding = {
  /** A MIME encoding for the message content. */
  contentEncoding?: string
  /** Application-specific message type. */
  messageType?: string
  /** The version of this binding. */
  bindingVersion?: string
}
