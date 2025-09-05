import { Type } from '@scalar/typebox'

export const XusePkceSchema = Type.Object({
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': Type.Optional(
    Type.Union([Type.Literal('SHA-256'), Type.Literal('plain'), Type.Literal('no')], { default: 'no' }),
  ),
})
