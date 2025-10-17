import { Type } from '@scalar/typebox'

import { PulsarRetentionDefinitionRef } from '../ref-definitions'

/**
 * Protocol-specific information for a Pulsar server.
 */
export const PulsarServerBindingSchemaDefinition = Type.Object({
  /** The pulsar tenant. If omitted, public MUST be assumed. */
  tenant: Type.Optional(Type.String()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Pulsar server.
 */
export type PulsarServerBinding = {
  /** The pulsar tenant. If omitted, public MUST be assumed. */
  tenant?: string
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Retention Definition Object for Pulsar.
 */
export const RetentionDefinitionSchemaDefinition = Type.Object({
  /** Time given in Minutes. */
  time: Type.Optional(Type.Integer()),
  /** Size given in MegaBytes. */
  size: Type.Optional(Type.Integer()),
})

/**
 * Retention Definition Object for Pulsar.
 */
export type RetentionDefinition = {
  /** Time given in Minutes. */
  time?: number
  /** Size given in MegaBytes. */
  size?: number
}

/**
 * Protocol-specific information for a Pulsar channel.
 */
export const PulsarChannelBindingSchemaDefinition = Type.Object({
  /** The namespace the channel is associated with. */
  namespace: Type.String(),
  /** Persistence of the topic in Pulsar. It MUST be either persistent or non-persistent. */
  persistence: Type.Union([Type.Literal('persistent'), Type.Literal('non-persistent')]),
  /** Topic compaction threshold given in Megabytes. */
  compaction: Type.Optional(Type.Integer()),
  /** A list of clusters the topic is replicated to. */
  'geo-replication': Type.Optional(Type.Array(Type.String())),
  /** Topic retention policy. */
  retention: Type.Optional(PulsarRetentionDefinitionRef),
  /** Message time-to-live in seconds. */
  ttl: Type.Optional(Type.Integer()),
  /** Message deduplication. When true, it ensures that each message produced on Pulsar topics is persisted to disk only once. */
  deduplication: Type.Optional(Type.Boolean()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Pulsar channel.
 */
export type PulsarChannelBinding = {
  /** The namespace the channel is associated with. */
  namespace: string
  /** Persistence of the topic in Pulsar. It MUST be either persistent or non-persistent. */
  persistence: 'persistent' | 'non-persistent'
  /** Topic compaction threshold given in Megabytes. */
  compaction?: number
  /** A list of clusters the topic is replicated to. */
  'geo-replication'?: string[]
  /** Topic retention policy. */
  retention?: RetentionDefinition
  /** Message time-to-live in seconds. */
  ttl?: number
  /** Message deduplication. When true, it ensures that each message produced on Pulsar topics is persisted to disk only once. */
  deduplication?: boolean
  /** The version of this binding. */
  bindingVersion?: string
}
