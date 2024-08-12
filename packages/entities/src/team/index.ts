import {
  type CustomProjectIconDefinition,
  customProjectIconSchema,
} from '@/project'
import { nanoidSchema, timestampSchema, unixTimestamp } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

export * from './retry'

export enum TeamUserRole {
  Admin = 'admin',
  User = 'user',
}

// ---------------------------------------------------------------------------

export const roleSchema = z.nativeEnum(TeamUserRole)

export type UserRef = {
  uid: string
  role: TeamUserRole
  displayName: string
  imageUri?: string
  activeProjectUid: string
}

export const userRefSchema = z.object({
  uid: nanoidSchema,
  role: roleSchema,
  displayName: z.string(),
  imageUri: z.string().optional(),
  activeProjectUid: z.string().default(''),
}) satisfies ZodSchema<UserRef, ZodTypeDef, any>

// ---------------------------------------------------------------------------

export const planSchema = z.union([
  z.literal('free'),
  z.literal('premium'),
  z.literal('pro_monthly'),
  z.literal('trial'),
])

export type BillingInfo = {
  billingId?: string
  plan: z.infer<typeof planSchema>
  planId: string
  expires?: number
}

export const billingInfoSchema = z.preprocess(
  (arg: any) => {
    if (
      typeof arg?.hasTrial === 'boolean' &&
      (arg?.plan !== 'premium' || arg?.plan !== 'pro_monthly')
    ) {
      arg.plan = 'trial'
    }
    return arg
  },
  z.object({
    billingId: nanoidSchema.optional(),
    plan: planSchema,
    planId: z.string().default(''),
    expires: z.number().optional(),
  }),
) satisfies ZodSchema<BillingInfo, ZodTypeDef, any>

// ---------------------------------------------------------------------------

export const pendingInviteSchema = z.object({
  uid: nanoidSchema,
  email: z.string().email(),
})

export type PendingInvite = z.infer<typeof pendingInviteSchema>

// ---------------------------------------------------------------------------
export type Team = {
  uid: string
  name: string
  email: string
  createdAt: number
  updatedAt: number
  billingInfo: BillingInfo
  projects: string[]
  users: UserRef[]
  icons: CustomProjectIconDefinition[]
  pendingInvites: PendingInvite[]
}

export const teamNameSchema = z
  .string()
  .trim()
  .transform((s) => (s.length ? s : 'Untitled Team'))

export const teamSchema = z.object({
  uid: nanoidSchema,
  name: teamNameSchema,
  email: z
    .string()
    .email()
    .transform((s) => s.toLowerCase()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  billingInfo: billingInfoSchema,
  projects: nanoidSchema.array(),
  users: userRefSchema.array(),
  icons: customProjectIconSchema.array().default([]),
  pendingInvites: pendingInviteSchema.array().default([]),
}) satisfies ZodSchema<Team, ZodTypeDef, any>

export function defaultTeam(
  userIndex: string,
  userId: string,
  projectId?: string,
  displayName = '',
  teamName = 'Default Team',
) {
  return teamSchema.parse({
    uid: nanoid(),
    name: teamName,
    email: userIndex,
    createdAt: unixTimestamp(),
    updatedAt: unixTimestamp(),
    billingInfo: { plan: '', hasTrial: false },
    projects: projectId ? [projectId] : [],
    users: [
      {
        uid: userId,
        role: TeamUserRole.Admin,
        displayName: displayName,
        imageUri: '',
        activeProjectUid: projectId ?? '',
      },
    ],
    icons: [],
    pendingInvites: [],
  })
}

// ---------------------------------------------------------------------------

/** Records used to determine if teams are restricted to federated auth only */
export type TeamControls = {
  teamUid: string
  /** Domains to allow users from ex. ['apidocumentation.com','scalar.com'] */
  domains: string[]
  preventPasswordAuth: boolean
}

export const teamControlsSchema = z.object({
  uid: nanoidSchema,
  teamUid: nanoidSchema,
  domains: z.string().min(5).array(),
  preventPasswordAuth: z.boolean(),
})
