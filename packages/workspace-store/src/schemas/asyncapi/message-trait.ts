import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Message Trait Schema
const MessageTraitSchemaDefinition = compose(
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
    /** The message headers. */
    headers: Type.Optional(Type.Any()), // Will be replaced with proper schema reference
    /** The message correlation ID. */
    correlationId: Type.Optional(Type.Any()), // Will be replaced with CorrelationIdObjectRef
    /** The content type of the message payload. */
    contentType: Type.Optional(Type.String()),
    /** The name of the message. */
    name: Type.Optional(Type.String()),
    /** A list of examples of the message. */
    examples: Type.Optional(Type.Array(Type.Any())), // Will be replaced with ExampleObjectRef
  }),
)

export type MessageTrait = {
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
  /** The message headers. */
  headers?: any // Will be replaced with proper schema reference
  /** The message correlation ID. */
  correlationId?: any // Will be replaced with CorrelationIdObject
  /** The content type of the message payload. */
  contentType?: string
  /** The name of the message. */
  name?: string
  /** A list of examples of the message. */
  examples?: any[] // Will be replaced with ExampleObject[]
}

// Module definition
const module = Type.Module({
  MessageTrait: MessageTraitSchemaDefinition,
})

// Export schemas
export const MessageTraitSchema = module.Import('MessageTrait')
