import type { ReplyAddressObject } from './reply-address'

/**
 * Describes the reply part of an operation. Used for request-reply operations to describe the expected response.
 */
export type ReplyObject = {
  /** A Reply Address Object that describes the address to use for the reply. */
  address?: ReplyAddressObject
  /** A $ref pointer to a Channel. The channel used for the reply. If the reply is expected on the same channel as the request was made, this field MAY be omitted. */
  channel?: string
  /** A list of $ref pointers to Message Objects that MAY be sent back. Every message sent back MUST be valid against one of the message schemas in this list. */
  messages?: string[]
}
