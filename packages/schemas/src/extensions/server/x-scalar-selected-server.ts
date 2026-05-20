import { object, optional, string } from '@scalar/validation'

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(string({ typeComment: 'The URL of the currently selected server' })),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment:
      'The URL of the currently selected server for this API description.\n\n@example\n```yaml\nx-scalar-selected-server: https://api.example.com\n```',
  },
)
