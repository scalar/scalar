import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Reply Schema
const ReplySchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. A $ref to the operation that this operation is a reply to. */
    address: Type.Optional(Type.Any()), // Will be replaced with proper address object
    /** A $ref to the Channel that this operation is related to. */
    channel: Type.Optional(Type.String()),
    /** A map where the keys describe the name of the message and the values describe the message. */
    messages: Type.Optional(Type.Array(Type.String())), // References to messages
  }),
)

export type Reply = {
  /** REQUIRED. A $ref to the operation that this operation is a reply to. */
  address?: any // Will be replaced with proper address object
  /** A $ref to the Channel that this operation is related to. */
  channel?: string
  /** A map where the keys describe the name of the message and the values describe the message. */
  messages?: string[] // References to messages
}

// Module definition
const module = Type.Module({
  Reply: ReplySchemaDefinition,
})

// Export schemas
export const ReplySchema = module.Import('Reply')
