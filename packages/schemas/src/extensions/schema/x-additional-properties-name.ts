import { object, optional, string } from '@scalar/validation'

export const XAdditionalPropertiesName = object(
  {
    'x-additionalPropertiesName': optional(string()),
  },
  {
    typeName: 'XAdditionalPropertiesName',
    typeComment: 'Name for additional properties in the schema',
  },
)
