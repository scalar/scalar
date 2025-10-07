import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Message Schema
const MessageSchemaDefinition = compose(
  Type.Object({
    /** A human-friendly title for the message. */
    title: Type.Optional(Type.String()),
    /** A short summary of what the message is about. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A list of tags for logical grouping and categorization of messages. */
    tags: Type.Optional(Type.Array(Type.Any())), // Will be replaced with TagObjectRef
    /** Additional external documentation for this message. */
    externalDocs: Type.Optional(Type.Any()), // Will be replaced with ExternalDocumentationObjectRef
    /** The message payload. */
    payload: Type.Optional(Type.Any()), // Will be replaced with proper schema reference
    /** The message headers. */
    headers: Type.Optional(Type.Any()), // Will be replaced with proper schema reference
    /** The message correlation ID. */
    correlationId: Type.Optional(Type.Any()), // Will be replaced with proper correlation ID object
    /** The content type of the message payload. */
    contentType: Type.Optional(Type.String()),
    /** The name of the message. */
    name: Type.Optional(Type.String()),
    /** A list of examples of the message. */
    examples: Type.Optional(Type.Array(Type.Any())), // Will be replaced with proper example objects
    /** A list of traits to apply to the message. */
    traits: Type.Optional(Type.Array(Type.Any())), // Will be replaced with proper trait references
  }),
)

export type Message = {
  /** A human-friendly title for the message. */
  title?: string
  /** A short summary of what the message is about. */
  summary?: string
  /** A verbose explanation of the message. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A list of tags for logical grouping and categorization of messages. */
  tags?: any[] // Will be replaced with TagObject[]
  /** Additional external documentation for this message. */
  externalDocs?: any // Will be replaced with ExternalDocumentationObject
  /** The message payload. */
  payload?: any // Will be replaced with proper schema reference
  /** The message headers. */
  headers?: any // Will be replaced with proper schema reference
  /** The message correlation ID. */
  correlationId?: any // Will be replaced with proper correlation ID object
  /** The content type of the message payload. */
  contentType?: string
  /** The name of the message. */
  name?: string
  /** A list of examples of the message. */
  examples?: any[] // Will be replaced with proper example objects
  /** A list of traits to apply to the message. */
  traits?: any[] // Will be replaced with proper trait references
}

// Module definition
const module = Type.Module({
  Message: MessageSchemaDefinition,
})

// Export schemas
export const MessageSchema = module.Import('Message')
