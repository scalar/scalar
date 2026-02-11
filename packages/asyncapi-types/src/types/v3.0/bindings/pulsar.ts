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
export type RetentionDefinition = {
  /** Time given in Minutes. */
  time?: number
  /** Size given in MegaBytes. */
  size?: number
}

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
