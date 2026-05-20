import { object, optional, string } from '@scalar/validation'

export const XVariable = object(
  {
    'x-variable': optional(string({ typeComment: 'Variable name used for substitution in the API client' })),
  },
  {
    typeName: 'XVariable',
    typeComment:
      'References a variable for schema property substitution in the API client.\n\n@example\n```yaml\nx-variable: userId\n```',
  },
)
