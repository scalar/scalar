import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Correlation ID Schema
export const CorrelationIdSchemaDefinition = compose(
  Type.Object({
    /** A description of the identifier. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** REQUIRED. A runtime expression that specifies the location of the correlation ID. */
    location: Type.String(),
  }),
)

export type CorrelationId = {
  /** A description of the identifier. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** REQUIRED. A runtime expression that specifies the location of the correlation ID. */
  location: string
}
