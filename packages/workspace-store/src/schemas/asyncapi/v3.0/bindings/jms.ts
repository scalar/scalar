import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for a JMS server.
 */
export const JmsServerBindingSchemaDefinition = Type.Object({
  /** The classname of the ConnectionFactory implementation for the JMS Provider. */
  jmsConnectionFactory: Type.String(),
  /** Additional properties to set on the JMS ConnectionFactory implementation for the JMS Provider. */
  properties: Type.Optional(
    Type.Array(
      Type.Object({
        name: Type.String(),
        value: Type.Unknown(),
      }),
    ),
  ),
  /** A client identifier for applications that use this JMS connection factory. */
  clientID: Type.Optional(Type.String()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a JMS server.
 */
export type JmsServerBinding = {
  /** The classname of the ConnectionFactory implementation for the JMS Provider. */
  jmsConnectionFactory: string
  /** Additional properties to set on the JMS ConnectionFactory implementation for the JMS Provider. */
  properties?: Array<{
    name: string
    value: unknown
  }>
  /** A client identifier for applications that use this JMS connection factory. */
  clientID?: string
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for a JMS channel.
 */
export const JmsChannelBindingSchemaDefinition = Type.Object({
  /** The destination (queue) name for this channel. SHOULD only be specified if the channel name differs from the actual destination name. */
  destination: Type.Optional(Type.String()),
  /** The type of destination, which MUST be either queue or fifo-queue. */
  destinationType: Type.Optional(Type.Union([Type.Literal('queue'), Type.Literal('fifo-queue')])),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a JMS channel.
 */
export type JmsChannelBinding = {
  /** The destination (queue) name for this channel. SHOULD only be specified if the channel name differs from the actual destination name. */
  destination?: string
  /** The type of destination, which MUST be either queue or fifo-queue. */
  destinationType?: 'queue' | 'fifo-queue'
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for a JMS message.
 */
export const JmsMessageBindingSchemaDefinition = Type.Object({
  /** A Schema object containing the definitions for JMS specific headers (protocol headers). This schema MUST be of type object and have a properties key. */
  headers: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a JMS message.
 */
export type JmsMessageBinding = {
  /** A Schema object containing the definitions for JMS specific headers (protocol headers). This schema MUST be of type object and have a properties key. */
  headers?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
