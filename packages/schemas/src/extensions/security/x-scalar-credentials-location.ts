import { literal, object, optional, union } from '@scalar/validation'

export const XScalarCredentialsLocation = object(
  {
    'x-scalar-credentials-location': optional(
      union([literal('header'), literal('body')], {
        typeComment: 'Where credentials are sent for this security scheme',
      }),
    ),
  },
  {
    typeName: 'XScalarCredentialsLocation',
    typeComment: 'Location for credentials in the request',
  },
)
