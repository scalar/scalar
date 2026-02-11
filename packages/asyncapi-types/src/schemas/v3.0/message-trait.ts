import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'
import {
  ExampleObjectRef,
  ExternalDocumentationObjectRef,
  SchemaObjectRef,
  TagObjectRef,
} from '@/openapi-types/v3.1/strict/ref-definitions'

import { CorrelationIdObjectRef } from './ref-definitions'

/**
 * Describes a trait that MAY be applied to a Message Object.
 * This object MAY contain any property from the Message Object, except payload and traits.
 */
export const MessageTraitObjectSchemaDefinition = compose(
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
    /** Schema definition of the application headers. */
    headers: Type.Optional(SchemaObjectRef),
    /** Definition of the correlation ID used for message tracing or matching. */
    correlationId: Type.Optional(CorrelationIdObjectRef),
    /** The content type to use when encoding/decoding a message's payload. */
    contentType: Type.Optional(Type.String()),
    /** A machine-friendly name for the message. */
    name: Type.Optional(Type.String()),
    /** List of examples. */
    examples: Type.Optional(Type.Array(ExampleObjectRef)),
  }),
)
