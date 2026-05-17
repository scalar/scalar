import { object, optional, string } from '@scalar/validation'

export const XScalarIcon = object(
  {
    'x-scalar-icon': optional(string()),
  },
  {
    typeName: 'XScalarIcon',
    typeComment: 'A custom icon representing the collection',
  },
)
