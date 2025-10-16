import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for an AMQP 0-9-1 server.
 */
export const AmqpBindingSchemaDefinition = Type.Object({
  /** Defines what type of exchange properties the channel will have. Can be either topic, direct, fanout, default or headers. */
  is: Type.Optional(
    Type.Union([
      Type.Literal('queue'),
      Type.Literal('routingKey'),
      Type.Literal('topic'),
      Type.Literal('direct'),
      Type.Literal('fanout'),
      Type.Literal('default'),
      Type.Literal('headers'),
    ]),
  ),
  /** When true, the server will reply with Declare-Ok if the exchange already exists, and raise an error if not. */
  durable: Type.Optional(Type.Boolean()),
  /** Whether the exchange should be deleted when the last queue is unbound from it. */
  autoDelete: Type.Optional(Type.Boolean()),
  /** The virtual host of the exchange. */
  vhost: Type.Optional(Type.String()),
  /** The name of the exchange. */
  exchange: Type.Optional(
    Type.Object({
      /** The name of the exchange. */
      name: Type.Optional(Type.String()),
      /** The type of the exchange. */
      type: Type.Optional(
        Type.Union([
          Type.Literal('topic'),
          Type.Literal('direct'),
          Type.Literal('fanout'),
          Type.Literal('default'),
          Type.Literal('headers'),
        ]),
      ),
      /** Whether the exchange is durable or not. */
      durable: Type.Optional(Type.Boolean()),
      /** Whether the exchange should be deleted when the last queue is unbound from it. */
      autoDelete: Type.Optional(Type.Boolean()),
      /** The virtual host of the exchange. */
      vhost: Type.Optional(Type.String()),
    }),
  ),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an AMQP 0-9-1 server.
 */
export type AmqpBinding = {
  /** Defines what type of exchange properties the channel will have. */
  is?: 'queue' | 'routingKey' | 'topic' | 'direct' | 'fanout' | 'default' | 'headers'
  /** When true, the server will reply with Declare-Ok if the exchange already exists, and raise an error if not. */
  durable?: boolean
  /** Whether the exchange should be deleted when the last queue is unbound from it. */
  autoDelete?: boolean
  /** The virtual host of the exchange. */
  vhost?: string
  /** The name of the exchange. */
  exchange?: {
    /** The name of the exchange. */
    name?: string
    /** The type of the exchange. */
    type?: 'topic' | 'direct' | 'fanout' | 'default' | 'headers'
    /** Whether the exchange is durable or not. */
    durable?: boolean
    /** Whether the exchange should be deleted when the last queue is unbound from it. */
    autoDelete?: boolean
    /** The virtual host of the exchange. */
    vhost?: string
  }
  /** The version of this binding. */
  bindingVersion?: string
}
