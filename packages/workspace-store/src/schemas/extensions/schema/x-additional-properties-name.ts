import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

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

export type XAdditionalPropertiesName = {
  /**
   * x-additionalPropertiesName
   *
   * Custom attribute name for additionalProperties in a schema.
   * This allows specifying a descriptive name for additional properties
   * that may be present in an object.
   */
  'x-additionalPropertiesName'?: string
}

export const XAdditionalPropertiesName = object(
  {
    'x-additionalPropertiesName': optional(string()),
  },
  {
    typeName: 'XAdditionalPropertiesName',
    typeComment: 'Display name for additional properties on a schema',
  },
)
