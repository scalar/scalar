import { object, optional, record, string } from '@scalar/validation'

export const XScalarSecurityBody = object(
  {
    'x-scalar-security-body': optional(record(string(), string())),
  },
  {
    typeName: 'XScalarSecurityBody',
    typeComment: 'Security body field values for the scheme',
  },
)
