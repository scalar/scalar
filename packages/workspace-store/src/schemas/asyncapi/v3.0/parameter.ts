import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// AsyncAPI Parameter Schema
const ParameterSchemaDefinition = compose(
  Type.Object({
    /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** The schema defining the type used for the parameter. */
    schema: Type.Optional(Type.Any()), // Will be replaced with SchemaObjectRef
    /** A runtime expression that specifies the location of the parameter value. */
    location: Type.Optional(Type.String()),
  }),
)

export type Parameter = {
  /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** The schema defining the type used for the parameter. */
  schema?: any // Will be replaced with SchemaObject
  /** A runtime expression that specifies the location of the parameter value. */
  location?: string
}

// Module definition
const module = Type.Module({
  Parameter: ParameterSchemaDefinition,
})

// Export schemas
export const ParameterSchema = module.Import('Parameter')
