import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'

/**
 * An object that contains information about the address to use to respond to a request.
 */
export const ReplyAddressObjectSchemaDefinition = compose(
  Type.Object({
    /** A runtime expression that specifies the location of the reply address. */
    location: Type.String(),
    /** A description of the reply address. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
  }),
)
