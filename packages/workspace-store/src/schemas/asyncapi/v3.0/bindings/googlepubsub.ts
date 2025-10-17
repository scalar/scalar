import { Type } from '@scalar/typebox'

import {
  GooglePubSubMessageStoragePolicyRef,
  GooglePubSubSchemaDefinitionRef,
  GooglePubSubSchemaSettingsRef,
} from '../ref-definitions'

/**
 * Message Storage Policy Object for Google Cloud Pub/Sub.
 */
export const MessageStoragePolicySchemaDefinition = Type.Object({
  /** A list of IDs of GCP regions where messages that are published to the topic may be persisted in storage. */
  allowedPersistenceRegions: Type.Optional(Type.Array(Type.String())),
})

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
export const SchemaSettingsSchemaDefinition = Type.Object({
  /** The encoding of the message. Must be one of the possible Encoding values (json or binary). */
  encoding: Type.Optional(Type.String()),
  /** The minimum (inclusive) revision allowed for validating messages. */
  firstRevisionId: Type.Optional(Type.String()),
  /** The maximum (inclusive) revision allowed for validating messages. */
  lastRevisionId: Type.Optional(Type.String()),
  /** The name of the schema that messages published should be validated against. The format is projects/{project}/schemas/{schema}. */
  name: Type.Optional(Type.String()),
})

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
export const GooglePubSubChannelBindingSchemaDefinition = Type.Object({
  /** An object of key-value pairs used to categorize Cloud Resources like Cloud Pub/Sub Topics. */
  labels: Type.Optional(Type.Record(Type.String(), Type.String())),
  /** Indicates the minimum duration to retain a message after it is published to the topic. Must be a valid Duration. */
  messageRetentionDuration: Type.Optional(Type.String()),
  /** Policy constraining the set of Google Cloud Platform regions where messages published to the topic may be stored. */
  messageStoragePolicy: Type.Optional(GooglePubSubMessageStoragePolicyRef),
  /** Settings for validating messages published against a schema. */
  schemaSettings: Type.Optional(GooglePubSubSchemaSettingsRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

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
export const SchemaDefinitionSchemaDefinition = Type.Object({
  /** The name of the schema. */
  name: Type.Optional(Type.String()),
})

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
export const GooglePubSubMessageBindingSchemaDefinition = Type.Object({
  /** Attributes for this message. If this field is empty, the message must contain non-empty data. This can be used to filter messages on the subscription. */
  attributes: Type.Optional(Type.Record(Type.String(), Type.String())),
  /** If non-empty, identifies related messages for which publish order should be respected. */
  orderingKey: Type.Optional(Type.String()),
  /** Describes the schema used to validate the payload of this message. */
  schema: Type.Optional(GooglePubSubSchemaDefinitionRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

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
