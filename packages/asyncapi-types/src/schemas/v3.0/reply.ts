import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'

import { ReplyAddressObjectRef } from './ref-definitions'

/**
 * Describes the reply part of an operation. Used for request-reply operations to describe the expected response.
 */
export const ReplyObjectSchemaDefinition = compose(
  Type.Object({
    /** A Reply Address Object that describes the address to use for the reply. */
    address: Type.Optional(ReplyAddressObjectRef),
    /** A $ref pointer to a Channel. The channel used for the reply. If the reply is expected on the same channel as the request was made, this field MAY be omitted. */
    channel: Type.Optional(Type.String()),
    /** A list of $ref pointers to Message Objects that MAY be sent back. Every message sent back MUST be valid against one of the message schemas in this list. */
    messages: Type.Optional(Type.Array(Type.String())),
  }),
)
