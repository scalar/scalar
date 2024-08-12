import { type Theme, themeSchema } from '@/theme'
import { nanoidSchema } from '@/utility'
import { z } from 'zod'

import { type Version, versionSchema } from './version'

/** Data to use during user onboarding */
export type SignupData = {
  uid: string
  version: Version
  theme?: Theme
  yjsDocs: Record<string, string>
  yjsReferences: Record<string, string>
}

export const signupDataSchema = z.object({
  uid: nanoidSchema,
  version: versionSchema,
  theme: themeSchema.optional(),
  yjsDocs: z.record(z.string(), z.string()),
  yjsReferences: z.record(z.string(), z.string()),
})
