import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

import { ReplyAddressRef } from './ref-definitions'
import type { ReplyAddress } from './reply-address'

/**
 * Describes the reply part of an operation. Used for request-reply operations to describe the expected response.
 */
export const ReplySchemaDefinition = compose(
  Type.Object({
    /** A Reply Address Object that describes the address to use for the reply. */
    address: Type.Optional(ReplyAddressRef),
    /** A $ref pointer to a Channel. The channel used for the reply. If the reply is expected on the same channel as the request was made, this field MAY be omitted. */
    channel: Type.Optional(Type.String()),
    /** A list of $ref pointers to Message Objects that MAY be sent back. Every message sent back MUST be valid against one of the message schemas in this list. */
    messages: Type.Optional(Type.Array(Type.String())),
  }),
)

/**
 * Describes the reply part of an operation. Used for request-reply operations to describe the expected response.
 */
export type Reply = {
  /** A Reply Address Object that describes the address to use for the reply. */
  address?: ReplyAddress
  /** A $ref pointer to a Channel. The channel used for the reply. If the reply is expected on the same channel as the request was made, this field MAY be omitted. */
  channel?: string
  /** A list of $ref pointers to Message Objects that MAY be sent back. Every message sent back MUST be valid against one of the message schemas in this list. */
  messages?: string[]
}
