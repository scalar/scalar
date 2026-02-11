import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'
import { SchemaObjectRef } from '@/openapi-types/v3.1/strict/ref-definitions'

/**
 * Describes a single parameter included in a channel address.
 */
export const ParameterObjectSchemaDefinition = compose(
  Type.Object({
    /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** The schema defining the type used for the parameter. */
    schema: Type.Optional(SchemaObjectRef),
    /** A runtime expression that specifies the location of the parameter value. */
    location: Type.Optional(Type.String()),
  }),
)
