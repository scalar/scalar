import { object, optional, string } from '@scalar/validation'

export const XScalarActiveEnvironment = object(
  {
    'x-scalar-active-environment': optional(string()),
  },
  {
    typeName: 'XScalarActiveEnvironment',
    typeComment: 'The active environment for the document',
  },
)
