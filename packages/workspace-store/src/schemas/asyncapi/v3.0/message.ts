import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import type { ExampleObject } from '@/schemas/v3.1/strict/example'
import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import {
  ExampleObjectRef,
  ExternalDocumentationObjectRef,
  SchemaObjectRef,
  TagObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import type { CorrelationId } from './correlation-id'
import { CorrelationIdSchemaDefinition } from './correlation-id'
import type { MessageTrait } from './message-trait'
import { MessageTraitSchemaDefinition } from './message-trait'

// Message Schema
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
    /** The message payload. */
    payload: Type.Optional(SchemaObjectRef),
    /** The message headers. */
    headers: Type.Optional(SchemaObjectRef),
    /** The message correlation ID. */
    correlationId: Type.Optional(CorrelationIdSchemaDefinition),
    /** The content type of the message payload. */
    contentType: Type.Optional(Type.String()),
    /** The name of the message. */
    name: Type.Optional(Type.String()),
    /** A list of examples of the message. */
    examples: Type.Optional(Type.Array(ExampleObjectRef)),
    /** A list of traits to apply to the message. */
    traits: Type.Optional(Type.Array(MessageTraitSchemaDefinition)),
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
  tags?: TagObject[]
  /** Additional external documentation for this message. */
  externalDocs?: ExternalDocumentationObject
  /** The message payload. */
  payload?: SchemaObject
  /** The message headers. */
  headers?: SchemaObject
  /** The message correlation ID. */
  correlationId?: CorrelationId
  /** The content type of the message payload. */
  contentType?: string
  /** The name of the message. */
  name?: string
  /** A list of examples of the message. */
  examples?: ExampleObject[]
  /** A list of traits to apply to the message. */
  traits?: MessageTrait[]
}
