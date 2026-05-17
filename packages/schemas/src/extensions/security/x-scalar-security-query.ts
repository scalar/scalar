import { object, optional, record, string } from '@scalar/validation'

export const XScalarSecurityQuery = object(
  {
    'x-scalar-security-query': optional(record(string(), string())),
  },
  {
    typeName: 'XScalarSecurityQuery',
    typeComment: 'Security query parameter values for the scheme',
  },
)
