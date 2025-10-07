import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

import type { ExternalDocumentationObject } from '../v3.1/strict/external-documentation'
import { ExternalDocumentationObjectRef, TagObjectRef } from '../v3.1/strict/ref-definitions'
import type { TagObject } from '../v3.1/strict/tag'
import type { Parameter } from './parameter'
import { ParameterSchema } from './parameter'

// Channel Item Schema - represents an individual channel
const ChannelItemSchemaDefinition = compose(
  Type.Object({
    /** A human-friendly title for the channel. */
    title: Type.Optional(Type.String()),
    /** A short summary of the channel. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the channel behavior. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A list of servers to which this channel applies. If servers is not provided, or is an empty array, the channel applies to all servers. */
    servers: Type.Optional(Type.Array(Type.String())),
    /** A map of the parameters included in the channel address. */
    parameters: Type.Optional(Type.Record(Type.String(), ParameterSchema)),
    /** A list of tags for logical grouping and categorization of channels. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this channel. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** A map of the operations available on this channel. */
    operations: Type.Optional(Type.Record(Type.String(), Type.String())), // References to operations
  }),
)

export type ChannelItem = {
  /** A human-friendly title for the channel. */
  title?: string
  /** A short summary of the channel. */
  summary?: string
  /** A verbose explanation of the channel behavior. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A list of servers to which this channel applies. If servers is not provided, or is an empty array, the channel applies to all servers. */
  servers?: string[]
  /** A map of the parameters included in the channel address. */
  parameters?: Record<string, Parameter>
  /** A list of tags for logical grouping and categorization of channels. */
  tags?: TagObject[]
  /** Additional external documentation for this channel. */
  externalDocs?: ExternalDocumentationObject
  /** A map of the operations available on this channel. */
  operations?: Record<string, string> // References to operations
}

// Channels Object Schema - map of channel names to channel items
const ChannelsObjectSchemaDefinition = Type.Record(Type.String(), ChannelItemSchemaDefinition)

export type ChannelsObject = Record<string, ChannelItem>

// Module definition
const module = Type.Module({
  ChannelItem: ChannelItemSchemaDefinition,
  ChannelsObject: ChannelsObjectSchemaDefinition,
})

// Export schemas
export const ChannelItemSchema = module.Import('ChannelItem')
export const ChannelsObjectSchema = module.Import('ChannelsObject')
