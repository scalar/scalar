import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'

import type { ChannelBindingsObject } from './binding'
import type { MessagesObject } from './messages'
import type { ParametersObject } from './parameters'
import type { TagsObject } from './tags'

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
  parameters?: ParametersObject
  /** A list of tags for logical grouping and categorization of channels. */
  tags?: TagsObject[]
  /** Additional external documentation for this channel. */
  externalDocs?: ExternalDocumentationObject
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the channel. */
  bindings?: ChannelBindingsObject
  /** A map of Message Objects (or references to them) that will be sent to this channel by any application at any time. */
  messages?: MessagesObject
}
