import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import { ExternalDocumentationObjectRef, SchemaObjectRef, TagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import type { CorrelationId } from './correlation-id'
import type { MessageExample } from './message-example'
import type { MessageTrait } from './message-trait'
import { CorrelationIdRef, MessageExampleRef, MessageTraitRef } from './ref-definitions'

/**
 * Describes a message received on a given channel and operation.
 */
export const MessageSchemaDefinition = compose(
  Type.Object({
    /** A human-friendly title for the message. */
    title: Type.Optional(Type.String()),
    /** A short summary of what the message is about. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A list of tags for logical grouping and categorization of messages. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this message. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** Definition of the message payload. It can be of any type but defaults to Schema Object. It must match the schema format, including the encoding type. */
    payload: Type.Optional(SchemaObjectRef),
    /** Schema definition of the application headers. Schema MUST be a map of key-value pairs. It MUST NOT define the protocol headers. */
    headers: Type.Optional(SchemaObjectRef),
    /** Definition of the correlation ID used for message tracing or matching. */
    correlationId: Type.Optional(CorrelationIdRef),
    /** The content type to use when encoding/decoding a message's payload. The value MUST be a specific media type (e.g. application/json). */
    contentType: Type.Optional(Type.String()),
    /** A machine-friendly name for the message. */
    name: Type.Optional(Type.String()),
    /** List of examples. */
    examples: Type.Optional(Type.Array(MessageExampleRef)),
    /** A list of traits to apply to the message object. Traits MUST be merged using traits merge mechanism. The resulting object MUST be a valid Message Object. */
    traits: Type.Optional(Type.Array(MessageTraitRef)),
    /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the message. */
    bindings: Type.Optional(Type.Record(Type.String(), Type.Any())),
  }),
)

/**
 * Describes a message received on a given channel and operation.
 */
export type Message = {
  /** A human-friendly title for the message. */
  title?: string
  /** A short summary of what the message is about. */
  summary?: string
  /** A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A list of tags for logical grouping and categorization of messages. */
  tags?: TagObject[]
  /** Additional external documentation for this message. */
  externalDocs?: ExternalDocumentationObject
  /** Definition of the message payload. It can be of any type but defaults to Schema Object. It must match the schema format, including the encoding type. */
  payload?: SchemaObject
  /** Schema definition of the application headers. Schema MUST be a map of key-value pairs. It MUST NOT define the protocol headers. */
  headers?: SchemaObject
  /** Definition of the correlation ID used for message tracing or matching. */
  correlationId?: CorrelationId
  /** The content type to use when encoding/decoding a message's payload. The value MUST be a specific media type (e.g. application/json). */
  contentType?: string
  /** A machine-friendly name for the message. */
  name?: string
  /** List of examples. */
  examples?: MessageExample[]
  /** A list of traits to apply to the message object. Traits MUST be merged using traits merge mechanism. The resulting object MUST be a valid Message Object. */
  traits?: MessageTrait[]
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the message. */
  bindings?: Record<string, any>
}
