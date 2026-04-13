import { Type } from '@scalar/typebox'
import { literal, object, union } from '@scalar/validation'

export const pkceOptions = ['SHA-256', 'plain', 'no'] as const

export const XusePkceSchema = Type.Object({
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': Type.Union(
    pkceOptions.map((option) => Type.Literal(option)),
    { default: 'no' },
  ),
})

export type XusePkce = {
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': (typeof pkceOptions)[number]
}

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
