import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

/**
 * Describes a single parameter included in a channel address.
 */
export type ParameterObject = {
  /** A verbose explanation of the parameter. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** The schema defining the type used for the parameter. */
  schema?: SchemaObject
  /** A runtime expression that specifies the location of the parameter value. */
  location?: string
}
