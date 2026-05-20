import { object, optional, string } from '@scalar/validation'

export const XScalarIcon = object(
  {
    'x-scalar-icon': optional(string({ typeComment: 'Icon identifier or URL for the API description' })),
  },
  {
    typeName: 'XScalarIcon',
    typeComment:
      'A custom icon representing the API description in the Scalar UI.\n\n@example\n```yaml\nx-scalar-icon: rocket\n```',
  },
)
