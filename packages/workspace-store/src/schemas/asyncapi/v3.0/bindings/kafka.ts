import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for a Kafka server.
 */
export const KafkaBindingSchemaDefinition = Type.Object({
  /** The topic name. */
  topic: Type.Optional(Type.String()),
  /** The number of partitions for this topic. */
  partitions: Type.Optional(Type.Integer()),
  /** The number of replicas for this topic. */
  replicas: Type.Optional(Type.Integer()),
  /** Topic configuration properties. */
  topicConfiguration: Type.Optional(Type.Record(Type.String(), Type.String())),
  /** A Schema object containing the definitions for Kafka-specific headers. */
  headers: Type.Optional(SchemaObjectRef),
  /** The Kafka message key. */
  key: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a Kafka server.
 */
export type KafkaBinding = {
  /** The topic name. */
  topic?: string
  /** The number of partitions for this topic. */
  partitions?: number
  /** The number of replicas for this topic. */
  replicas?: number
  /** Topic configuration properties. */
  topicConfiguration?: Record<string, string>
  /** A Schema object containing the definitions for Kafka-specific headers. */
  headers?: SchemaObject
  /** The Kafka message key. */
  key?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
