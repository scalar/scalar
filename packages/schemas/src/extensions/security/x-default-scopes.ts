import { array, object, optional, string } from '@scalar/validation'

export const XDefaultScopes = object(
  {
    'x-default-scopes': optional(array(string())),
  },
  {
    typeName: 'XDefaultScopes',
    typeComment: 'Default OAuth scopes for the security scheme',
  },
)
