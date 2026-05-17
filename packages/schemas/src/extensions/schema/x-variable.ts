import { object, optional, string } from '@scalar/validation'

export const XVariable = object(
  {
    'x-variable': optional(string()),
  },
  {
    typeName: 'XVariable',
    typeComment: 'Variable name for schema substitution',
  },
)
