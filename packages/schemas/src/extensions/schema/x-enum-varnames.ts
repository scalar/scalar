import { array, object, optional, string } from '@scalar/validation'

export const XEnumVarNames = object(
  {
    'x-enum-varnames': optional(array(string())),
    'x-enumNames': optional(array(string())),
  },
  {
    typeName: 'XEnumVarNames',
    typeComment: 'Variable names for enum values',
  },
)
