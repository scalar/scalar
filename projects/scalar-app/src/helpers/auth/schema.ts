import { type Static, literal, number, object, string, union } from '@scalar/validation'

const roleSchema = union([literal('viewer'), literal('editor'), literal('owner'), literal('admin')])

/** Schema for the decoded payload of a Scalar access token JWT */
export const accessTokenPayloadSchema = object({
  userIndex: string({ typeComment: 'Internal user index used for lookups' }),
  userUid: string({ typeComment: 'Unique identifier for the user' }),
  teamUid: string({ typeComment: 'Unique identifier for the team' }),
  email: string({ typeComment: "User's email address" }),
  role: roleSchema,
  exp: number({ typeComment: 'Token expiry time as a Unix timestamp' }),
})

/** Decoded payload extracted from a Scalar access token JWT */
export type AccessTokenPayload = Static<typeof accessTokenPayloadSchema>

/** Schema for the token pair returned by the auth server */
export const tokenResponseSchema = object({
  accessToken: string({
    typeComment: 'Short-lived JWT used to authenticate API requests',
  }),
  refreshToken: string({
    typeComment: 'Long-lived token used to obtain a new access token',
  }),
})

/** Access and refresh token pair returned after a successful auth exchange */
export type TokenResponse = Static<typeof tokenResponseSchema>
