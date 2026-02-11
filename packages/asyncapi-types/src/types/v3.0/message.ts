import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'
import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'
import type { TagObject } from '@/openapi-types/v3.1/strict/tag'

import type { MessageBindingsObject } from './binding'
import type { CorrelationIdObject } from './correlation-id'
import type { MessageExampleObject } from './message-example'
import type { MessageTraitObject } from './message-trait'

/**
 * Describes a message received on a given channel and operation.
 */
export type MessageObject = {
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
  correlationId?: CorrelationIdObject
  /** The content type to use when encoding/decoding a message's payload. The value MUST be a specific media type (e.g. application/json). */
  contentType?: string
  /** A machine-friendly name for the message. */
  name?: string
  /** List of examples. */
  examples?: MessageExampleObject[]
  /** A list of traits to apply to the message object. Traits MUST be merged using traits merge mechanism. The resulting object MUST be a valid Message Object. */
  traits?: MessageTraitObject[]
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the message. */
  bindings?: MessageBindingsObject
}
