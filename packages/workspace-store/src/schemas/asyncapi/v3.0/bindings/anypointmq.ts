import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for an Anypoint MQ channel.
 */
export const AnypointMqChannelBindingSchemaDefinition = Type.Object({
  /** The destination (queue or exchange) name for this channel. SHOULD only be specified if the channel name differs from the actual destination name. */
  destination: Type.Optional(Type.String()),
  /** The type of destination, which MUST be either exchange, queue, or fifo-queue. */
  destinationType: Type.Optional(
    Type.Union([Type.Literal('exchange'), Type.Literal('queue'), Type.Literal('fifo-queue')]),
  ),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an Anypoint MQ channel.
 */
export type AnypointMqChannelBinding = {
  /** The destination (queue or exchange) name for this channel. SHOULD only be specified if the channel name differs from the actual destination name. */
  destination?: string
  /** The type of destination, which MUST be either exchange, queue, or fifo-queue. */
  destinationType?: 'exchange' | 'queue' | 'fifo-queue'
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an Anypoint MQ message.
 */
export const AnypointMqMessageBindingSchemaDefinition = Type.Object({
  /** A Schema object containing the definitions for Anypoint MQ-specific headers (protocol headers). This schema MUST be of type object and have a properties key. */
  headers: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an Anypoint MQ message.
 */
export type AnypointMqMessageBinding = {
  /** A Schema object containing the definitions for Anypoint MQ-specific headers (protocol headers). This schema MUST be of type object and have a properties key. */
  headers?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
