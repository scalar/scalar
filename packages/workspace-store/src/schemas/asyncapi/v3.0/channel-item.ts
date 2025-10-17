import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import { ExternalDocumentationObjectRef, TagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import type { ParameterObject } from './parameter'
import { ParameterRef } from './ref-definitions'

/**
 * Describes a shared communication channel.
 */
export const ChannelObjectSchemaDefinition = compose(
  Type.Object({
    /** An optional string for the channel's address (URL, topic name, queue name, etc.). */
    address: Type.Optional(Type.String()),
    /** A human-friendly title for the channel. */
    title: Type.Optional(Type.String()),
    /** A short summary of the channel. */
    summary: Type.Optional(Type.String()),
    /** An optional description of this channel. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** An optional list of servers on which this channel is available. If absent or empty, this channel is available on all servers defined for this application. */
    servers: Type.Optional(Type.Array(Type.String())),
    /** A map of the parameters included in the channel address. It MUST be present only when the address contains Channel Address Expressions. */
    parameters: Type.Optional(Type.Record(Type.String(), ParameterRef)),
    /** A list of tags for logical grouping and categorization of channels. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this channel. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the channel. */
    bindings: Type.Optional(Type.Record(Type.String(), Type.Any())),
    /** An optional array of messages that will be sent to this channel by the application. */
    messages: Type.Optional(Type.Record(Type.String(), Type.String())),
  }),
)

/**
 * Describes a shared communication channel.
 */
export type ChannelObject = {
  /** An optional string for the channel's address (URL, topic name, queue name, etc.). */
  address?: string
  /** A human-friendly title for the channel. */
  title?: string
  /** A short summary of the channel. */
  summary?: string
  /** An optional description of this channel. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** An optional list of servers on which this channel is available. If absent or empty, this channel is available on all servers defined for this application. */
  servers?: string[]
  /** A map of the parameters included in the channel address. It MUST be present only when the address contains Channel Address Expressions. */
  parameters?: Record<string, ParameterObject>
  /** A list of tags for logical grouping and categorization of channels. */
  tags?: TagObject[]
  /** Additional external documentation for this channel. */
  externalDocs?: ExternalDocumentationObject
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the channel. */
  bindings?: Record<string, any>
  /** An optional array of messages that will be sent to this channel by the application. */
  messages?: Record<string, string>
}
