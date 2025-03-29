import { z } from 'zod'

/** Options for the x-usePkce extension */
export const XUsePkceValues = ['SHA-256', 'plain', 'no'] as const

export const XusePkceSchema = z.object({
  /**
   * Use x-usePkce to enable Proof Key for Code Exchange (PKCE) for the Oauth2 authorization code flow.
   */
  'x-usePkce': z.enum(XUsePkceValues).optional().default('no'),
})
