import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

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
