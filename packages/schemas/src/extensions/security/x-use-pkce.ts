import { literal, object, union } from '@scalar/validation'

export const XusePkce = object(
  {
    'x-usePkce': union([literal('no'), literal('SHA-256'), literal('plain')], {
      typeComment: 'PKCE mode for the OAuth2 authorization code flow',
    }),
  },
  {
    typeName: 'XusePkce',
    typeComment: 'PKCE setting for OAuth2',
  },
)
