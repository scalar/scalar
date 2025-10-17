import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for a Solace server.
 */
export const SolaceServerBindingSchemaDefinition = Type.Object({
  /** The Virtual Private Network name on the Solace broker. */
  msgVpn: Type.Optional(Type.String()),
  /** A unique client name to use to register to the appliance. If specified, it must be a valid Topic name, and a maximum of 160 bytes in length when encoded as UTF-8. */
  clientName: Type.Optional(Type.String({ maxLength: 160 })),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Solace server.
 */
export type SolaceServerBinding = {
  /** The Virtual Private Network name on the Solace broker. */
  msgVpn?: string
  /** A unique client name to use to register to the appliance. If specified, it must be a valid Topic name, and a maximum of 160 bytes in length when encoded as UTF-8. */
  clientName?: string
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Destination Object for Solace.
 */
const DestinationSchemaDefinition = Type.Object({
  /** The type of destination, which can be queue or topic. */
  destinationType: Type.Optional(Type.Union([Type.Literal('queue'), Type.Literal('topic')])),
  /** The delivery mode, which can be direct or persistent. This determines the quality of service for publishing messages. Default is persistent. */
  deliveryMode: Type.Optional(Type.Union([Type.Literal('direct'), Type.Literal('persistent')])),
  /** Queue-specific properties. */
  queue: Type.Optional(
    Type.Object({
      /** The name of the queue, only applicable when destinationType is queue. */
      name: Type.Optional(Type.String()),
      /** A list of topics that the queue subscribes to, only applicable when destinationType is queue. */
      topicSubscriptions: Type.Optional(Type.Array(Type.String())),
      /** The access type, which can be exclusive or nonexclusive. Only applicable when destinationType is queue. */
      accessType: Type.Optional(Type.Union([Type.Literal('exclusive'), Type.Literal('nonexclusive')])),
      /** The maximum amount of message spool that the given queue may use. Only applicable when destinationType is queue. */
      maxMsgSpoolSize: Type.Optional(Type.String()),
      /** The maximum TTL to apply to messages to be spooled. Only applicable when destinationType is queue. */
      maxTtl: Type.Optional(Type.String()),
    }),
  ),
  /** Topic-specific properties. */
  topic: Type.Optional(
    Type.Object({
      /** A list of topics that the client subscribes to, only applicable when destinationType is topic. */
      topicSubscriptions: Type.Optional(Type.Array(Type.String())),
    }),
  ),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Destination Object for Solace.
 */
export type Destination = {
  /** The type of destination, which can be queue or topic. */
  destinationType?: 'queue' | 'topic'
  /** The delivery mode, which can be direct or persistent. This determines the quality of service for publishing messages. Default is persistent. */
  deliveryMode?: 'direct' | 'persistent'
  /** Queue-specific properties. */
  queue?: {
    /** The name of the queue, only applicable when destinationType is queue. */
    name?: string
    /** A list of topics that the queue subscribes to, only applicable when destinationType is queue. */
    topicSubscriptions?: string[]
    /** The access type, which can be exclusive or nonexclusive. Only applicable when destinationType is queue. */
    accessType?: 'exclusive' | 'nonexclusive'
    /** The maximum amount of message spool that the given queue may use. Only applicable when destinationType is queue. */
    maxMsgSpoolSize?: string
    /** The maximum TTL to apply to messages to be spooled. Only applicable when destinationType is queue. */
    maxTtl?: string
  }
  /** Topic-specific properties. */
  topic?: {
    /** A list of topics that the client subscribes to, only applicable when destinationType is topic. */
    topicSubscriptions?: string[]
  }
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for a Solace operation.
 */
export const SolaceOperationBindingSchemaDefinition = Type.Object({
  /** List of destination objects. */
  destinations: Type.Optional(Type.Array(DestinationSchemaDefinition)),
  /** Interval in milliseconds or a Schema Object containing the definition of the lifetime of the message. */
  timeToLive: Type.Optional(Type.Union([Type.Integer(), SchemaObjectRef])),
  /** The valid priority value range is 0-255 with 0 as the lowest priority and 255 as the highest or a Schema Object containing the definition of the priority. */
  priority: Type.Optional(Type.Union([Type.Integer({ minimum: 0, maximum: 255 }), SchemaObjectRef])),
  /** Set the message to be eligible to be moved to a Dead Message Queue. The default value is false. */
  dmqEligible: Type.Optional(Type.Boolean()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Solace operation.
 */
export type SolaceOperationBinding = {
  /** List of destination objects. */
  destinations?: Destination[]
  /** Interval in milliseconds or a Schema Object containing the definition of the lifetime of the message. */
  timeToLive?: number | SchemaObject
  /** The valid priority value range is 0-255 with 0 as the lowest priority and 255 as the highest or a Schema Object containing the definition of the priority. */
  priority?: number | SchemaObject
  /** Set the message to be eligible to be moved to a Dead Message Queue. The default value is false. */
  dmqEligible?: boolean
  /** The version of this binding. */
  bindingVersion?: string
}
