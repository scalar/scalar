import { nanoidSchema, timestampSchema } from '@/utility'
import { type ZodSchema, z } from 'zod'

/** Record of all site deploys */
export type SiteDeploy = {
  uid: string
  domain: string
  teamUid: string
  projectUid: string
  createdAt: number
  updatedAt: number
}

export const siteDeploySchema: ZodSchema<SiteDeploy> = z.object({
  uid: nanoidSchema,
  domain: z.string(),
  teamUid: nanoidSchema,
  projectUid: nanoidSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
