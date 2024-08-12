import { TeamUserRole, teamNameSchema } from '@/team'
import { nanoidSchema, timestampSchema } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export type TeamRef = {
  teamUid: string
  teamName: string
  role: TeamUserRole
}

export const teamRefSchema = z.object({
  teamUid: z.string(),
  teamName: teamNameSchema,
  role: z.nativeEnum(TeamUserRole),
}) satisfies ZodSchema<TeamRef, ZodTypeDef, any>

/** User def for app usage */
export type User = {
  /** Application UID (separate from mongo _id) */
  uid: string
  /** Email or other unique token identifier for performant auth lookup */
  userIndex: string
  /** Federated auth provided must have a linked email */
  email: string
  teams: TeamRef[]
  activeTeamId: string | null
  hasGithub?: boolean
}

export const userSchema = z.object({
  uid: z.string(),
  userIndex: z.string().transform((s) => s.toLowerCase()),
  email: z.string().transform((s) => s.toLowerCase()),
  teams: teamRefSchema.array(),
  activeTeamId: z.string().nullable(),
  hasGithub: z.boolean().optional().default(false),
}) satisfies ZodSchema<User, ZodTypeDef, any>

export function defaultUser(): User {
  return {
    uid: nanoid(),
    userIndex: 'user@example.com',
    email: 'user@example.com',
    teams: [],
    hasGithub: false,
    activeTeamId: null,
  }
}

/** GitHub user data stored for doing publishes */
export type UserGithub = {
  uid: string
  token: string
  refreshToken: string
  expiry: number
  refreshExpiry: number
}

export const userGithubSchema = z.object({
  uid: nanoidSchema,
  token: z.string(),
  refreshToken: z.string(),
  expiry: timestampSchema,
  refreshExpiry: timestampSchema,
}) satisfies ZodSchema<UserGithub>

/** Store passwords in a separate collection to prevent accidental queries */
export type UserPassword = {
  uid: string
  salt: string
  password: string | null
}

export const userPasswordSchema = z.object({
  uid: nanoidSchema,
  salt: z.string(),
  password: z.string().nullable(),
}) satisfies ZodSchema<UserPassword, ZodTypeDef, any>
