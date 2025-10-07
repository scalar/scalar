import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

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
    parameters: Type.Optional(Type.Record(Type.String(), Type.Any())), // Will be replaced with proper ParameterObjectRef
    /** A list of tags for logical grouping and categorization of channels. */
    tags: Type.Optional(Type.Array(Type.Any())), // Will be replaced with TagObjectRef
    /** Additional external documentation for this channel. */
    externalDocs: Type.Optional(Type.Any()), // Will be replaced with ExternalDocumentationObjectRef
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
  parameters?: Record<string, any> // Will be replaced with proper ParameterObject type
  /** A list of tags for logical grouping and categorization of channels. */
  tags?: any[] // Will be replaced with TagObject[]
  /** Additional external documentation for this channel. */
  externalDocs?: any // Will be replaced with ExternalDocumentationObject
  /** A map of the operations available on this channel. */
  operations?: Record<string, string> // References to operations
}

// Module definition
const module = Type.Module({
  ChannelItem: ChannelItemSchemaDefinition,
})

// Export schemas
export const ChannelItemSchema = module.Import('ChannelItem')
