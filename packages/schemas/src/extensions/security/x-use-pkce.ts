import { literal, object, union } from '@scalar/validation'

export const XusePkce = object(
  {
    'x-usePkce': union([literal('SHA-256'), literal('plain'), literal('no')], {
      typeComment: 'PKCE mode for the OAuth2 authorization code flow',
    }),
  },
  {
    typeName: 'XusePkce',
    typeComment: 'PKCE setting for OAuth2',
  },
)
