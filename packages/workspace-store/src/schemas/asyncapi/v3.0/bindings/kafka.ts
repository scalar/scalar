import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

import { KafkaTopicConfigurationRef } from '../ref-definitions'

/**
 * Protocol-specific information for a Kafka server.
 */
export const KafkaServerBindingSchemaDefinition = Type.Object({
  /** API URL for the Schema Registry used when producing Kafka messages (if a Schema Registry was used). */
  schemaRegistryUrl: Type.Optional(Type.String()),
  /** The vendor of Schema Registry and Kafka serdes library that should be used (e.g. apicurio, confluent, ibm, or karapace). */
  schemaRegistryVendor: Type.Optional(Type.String()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Kafka server.
 */
export type KafkaServerBinding = {
  /** API URL for the Schema Registry used when producing Kafka messages (if a Schema Registry was used). */
  schemaRegistryUrl?: string
  /** The vendor of Schema Registry and Kafka serdes library that should be used (e.g. apicurio, confluent, ibm, or karapace). */
  schemaRegistryVendor?: string
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Topic configuration properties for Kafka.
 */
export const TopicConfigurationSchemaDefinition = Type.Object({
  /** The cleanup.policy configuration option. */
  'cleanup.policy': Type.Optional(Type.Array(Type.Union([Type.Literal('delete'), Type.Literal('compact')]))),
  /** The retention.ms configuration option. */
  'retention.ms': Type.Optional(Type.Number()),
  /** The retention.bytes configuration option. */
  'retention.bytes': Type.Optional(Type.Number()),
  /** The delete.retention.ms configuration option. */
  'delete.retention.ms': Type.Optional(Type.Number()),
  /** The max.message.bytes configuration option. */
  'max.message.bytes': Type.Optional(Type.Integer()),
  /** It shows whether the schema validation for the message key is enabled. Vendor specific config. */
  'confluent.key.schema.validation': Type.Optional(Type.Boolean()),
  /** The name of the schema lookup strategy for the message key. Vendor specific config. */
  'confluent.key.subject.name.strategy': Type.Optional(Type.String()),
  /** It shows whether the schema validation for the message value is enabled. Vendor specific config. */
  'confluent.value.schema.validation': Type.Optional(Type.Boolean()),
  /** The name of the schema lookup strategy for the message value. Vendor specific config. */
  'confluent.value.subject.name.strategy': Type.Optional(Type.String()),
})

/**
 * Topic configuration properties for Kafka.
 */
export type TopicConfiguration = {
  /** The cleanup.policy configuration option. */
  'cleanup.policy'?: Array<'delete' | 'compact'>
  /** The retention.ms configuration option. */
  'retention.ms'?: number
  /** The retention.bytes configuration option. */
  'retention.bytes'?: number
  /** The delete.retention.ms configuration option. */
  'delete.retention.ms'?: number
  /** The max.message.bytes configuration option. */
  'max.message.bytes'?: number
  /** It shows whether the schema validation for the message key is enabled. Vendor specific config. */
  'confluent.key.schema.validation'?: boolean
  /** The name of the schema lookup strategy for the message key. Vendor specific config. */
  'confluent.key.subject.name.strategy'?: string
  /** It shows whether the schema validation for the message value is enabled. Vendor specific config. */
  'confluent.value.schema.validation'?: boolean
  /** The name of the schema lookup strategy for the message value. Vendor specific config. */
  'confluent.value.subject.name.strategy'?: string
}

/**
 * Protocol-specific information for a Kafka channel (topic).
 */
export const KafkaChannelBindingSchemaDefinition = Type.Object({
  /** Kafka topic name if different from channel name. */
  topic: Type.Optional(Type.String()),
  /** Number of partitions configured on this topic (useful to know how many parallel consumers you may run). */
  partitions: Type.Optional(Type.Integer({ minimum: 1 })),
  /** Number of replicas configured on this topic. */
  replicas: Type.Optional(Type.Integer({ minimum: 1 })),
  /** Topic configuration properties that are relevant for the API. */
  topicConfiguration: Type.Optional(KafkaTopicConfigurationRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Kafka channel (topic).
 */
export type KafkaChannelBinding = {
  /** Kafka topic name if different from channel name. */
  topic?: string
  /** Number of partitions configured on this topic (useful to know how many parallel consumers you may run). */
  partitions?: number
  /** Number of replicas configured on this topic. */
  replicas?: number
  /** Topic configuration properties that are relevant for the API. */
  topicConfiguration?: TopicConfiguration
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for a Kafka operation.
 */
export const KafkaOperationBindingSchemaDefinition = Type.Object({
  /** Id of the consumer group. */
  groupId: Type.Optional(SchemaObjectRef),
  /** Id of the consumer inside a consumer group. */
  clientId: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Kafka operation.
 */
export type KafkaOperationBinding = {
  /** Id of the consumer group. */
  groupId?: SchemaObject
  /** Id of the consumer inside a consumer group. */
  clientId?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for a Kafka message.
 */
export const KafkaMessageBindingSchemaDefinition = Type.Object({
  /** The message key. */
  key: Type.Optional(SchemaObjectRef),
  /** If a Schema Registry is used when performing this operation, tells where the id of schema is stored (e.g. header or payload). */
  schemaIdLocation: Type.Optional(Type.String()),
  /** Number of bytes or vendor specific values when schema id is encoded in payload (e.g confluent / apicurio-legacy / apicurio-new). */
  schemaIdPayloadEncoding: Type.Optional(Type.String()),
  /** Freeform string for any naming strategy class to use. Clients should default to the vendor default if not supplied. */
  schemaLookupStrategy: Type.Optional(Type.String()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Kafka message.
 */
export type KafkaMessageBinding = {
  /** The message key. */
  key?: SchemaObject
  /** If a Schema Registry is used when performing this operation, tells where the id of schema is stored (e.g. header or payload). */
  schemaIdLocation?: string
  /** Number of bytes or vendor specific values when schema id is encoded in payload (e.g confluent / apicurio-legacy / apicurio-new). */
  schemaIdPayloadEncoding?: string
  /** Freeform string for any naming strategy class to use. Clients should default to the vendor default if not supplied. */
  schemaLookupStrategy?: string
  /** The version of this binding. */
  bindingVersion?: string
}
