import { Type } from '@scalar/typebox'

/**
 * x-additionalPropertiesName
 *
 * Custom attribute name for additionalProperties in a schema.
 * This allows specifying a descriptive name for additional properties
 * that may be present in an object.
 */
export const XAdditionalPropertiesNameSchema = Type.Object({
  'x-additionalPropertiesName': Type.Optional(Type.String()),
})
