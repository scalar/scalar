import { Type } from '@scalar/typebox'

/** Options for the x-usePkce extension */
export const XUsePkceValues = ['SHA-256', 'plain', 'no'] as const

export const XusePkceSchema = Type.Object({
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': Type.Union(
    XUsePkceValues.map((value) => Type.Literal(value)),
    { default: 'no' },
  ),
})

export type XusePkce = {
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': 'SHA-256' | 'plain' | 'no'
}
