import type { ExampleObject } from '@/openapi-types/v3.1/strict/example'
import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'
import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

import type { CorrelationIdObject } from './correlation-id'
import type { TagsObject } from './tags'

/**
 * Describes a trait that MAY be applied to a Message Object.
 * This object MAY contain any property from the Message Object, except payload and traits.
 */
export type MessageTraitObject = {
  title?: string
  /** A short summary of what the message is about. */
  summary?: string
  /** A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A list of tags for logical grouping and categorization of messages. */
  tags?: TagsObject[]
  /** Additional external documentation for this message. */
  externalDocs?: ExternalDocumentationObject
  /** Schema definition of the application headers. */
  headers?: SchemaObject
  /** Definition of the correlation ID used for message tracing or matching. */
  correlationId?: CorrelationIdObject
  /** The content type to use when encoding/decoding a message's payload. */
  contentType?: string
  /** A machine-friendly name for the message. */
  name?: string
  /** List of examples. */
  examples?: ExampleObject[]
}
