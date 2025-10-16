import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Describes a single parameter included in a channel address.
 */
export const ParameterSchemaDefinition = compose(
  Type.Object({
    /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** The schema defining the type used for the parameter. */
    schema: Type.Optional(SchemaObjectRef),
    /** A runtime expression that specifies the location of the parameter value. */
    location: Type.Optional(Type.String()),
  }),
)

/**
 * Describes a single parameter included in a channel address.
 */
export type Parameter = {
  /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** The schema defining the type used for the parameter. */
  schema?: SchemaObject
  /** A runtime expression that specifies the location of the parameter value. */
  location?: string
}
