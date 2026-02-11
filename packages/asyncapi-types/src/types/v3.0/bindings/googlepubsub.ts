/**
 * Message Storage Policy Object for Google Cloud Pub/Sub.
 */
export type MessageStoragePolicy = {
  /** A list of IDs of GCP regions where messages that are published to the topic may be persisted in storage. */
  allowedPersistenceRegions?: string[]
}

/**
 * Schema Settings Object for Google Cloud Pub/Sub.
 */
export type SchemaSettings = {
  /** The encoding of the message. Must be one of the possible Encoding values (json or binary). */
  encoding?: string
  /** The minimum (inclusive) revision allowed for validating messages. */
  firstRevisionId?: string
  /** The maximum (inclusive) revision allowed for validating messages. */
  lastRevisionId?: string
  /** The name of the schema that messages published should be validated against. The format is projects/{project}/schemas/{schema}. */
  name?: string
}

/**
 * Protocol-specific information for a Google Cloud Pub/Sub channel.
 */
export type GooglePubSubChannelBinding = {
  /** An object of key-value pairs used to categorize Cloud Resources like Cloud Pub/Sub Topics. */
  labels?: Record<string, string>
  /** Indicates the minimum duration to retain a message after it is published to the topic. Must be a valid Duration. */
  messageRetentionDuration?: string
  /** Policy constraining the set of Google Cloud Platform regions where messages published to the topic may be stored. */
  messageStoragePolicy?: MessageStoragePolicy
  /** Settings for validating messages published against a schema. */
  schemaSettings?: SchemaSettings
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Schema Definition Object for Google Cloud Pub/Sub.
 */
export type SchemaDefinition = {
  /** The name of the schema. */
  name?: string
}

/**
 * Protocol-specific information for a Google Cloud Pub/Sub message.
 */
export type GooglePubSubMessageBinding = {
  /** Attributes for this message. If this field is empty, the message must contain non-empty data. This can be used to filter messages on the subscription. */
  attributes?: Record<string, string>
  /** If non-empty, identifies related messages for which publish order should be respected. */
  orderingKey?: string
  /** Describes the schema used to validate the payload of this message. */
  schema?: SchemaDefinition
  /** The version of this binding. */
  bindingVersion?: string
}
