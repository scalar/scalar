import { type TeamUserRole, roleSchema } from '@/team'
import { nanoidSchema, timestampSchema } from '@/utility'
import { type ZodSchema, z } from 'zod'

// Access token payload will move to being user defined in the future
// Must always be a flat primitive record like Record<string, string|number|boolean>
export type AccessTokenPayload = {
  userIndex: string
  userUid: string
  teamUid: string
  email: string | null
  role?: TeamUserRole
  exp: number
}

export const accessTokenPayloadSchema = z.object({
  userIndex: z.string(),
  userUid: z.string(),
  teamUid: z.string(),
  email: z.string().nullable(),
  role: roleSchema.optional(),
  exp: z.number().int(),
}) satisfies z.ZodType<AccessTokenPayload>

export type RefreshTokenPayload = {
  /** Uid of token */
  uid: string
  /** Uid of team */
  teamUid: string | null
  /** Type of the token. Always set to 'refresh' for now */
  type: string
  /** Token family ID to associate a login sessions set of refresh tokens */
  familyId: string
  /** Unique user index to query user record */
  userIndex: string
  /** Expiry in seconds */
  exp: number
}
export const refreshTokenPayloadSchema: z.ZodType<RefreshTokenPayload> =
  z.object({
    uid: z.string(),
    teamUid: z.string().nullable(),
    type: z.string(),
    familyId: z.string(),
    userIndex: z.string(),
    exp: z.number(),
  })
