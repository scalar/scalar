import { nanoidSchema, timestampSchema } from '@/utility'
import { z } from 'zod'

export const githubProjectSchema = z.object({
  uid: nanoidSchema,
  name: z.string(),
  createdAt: timestampSchema,
  /** Last publish status info */
  publishStatus: z.string().default(''),
  /** Last publish output message */
  publishMessage: z.string().default(''),
  /** Reference info for the link repository */
  repository: z.object({
    linkedBy: z.string(),
    id: z.number(),
    name: z.string().min(2),
    configPath: z.string().default(''),
    branch: z.string().default(''),
    publishOnMerge: z.boolean().default(false),
  }),
})

export type GithubProject = z.infer<typeof githubProjectSchema>

export const githubProjectRepoSchema = z.object({
  /** UID is shared with the corresponding github project */
  uid: nanoidSchema,
  /** Team UID used to find the correct collection */
  teamUid: nanoidSchema,
  /** Repository Id */
  repoId: z.number(),
})

export type GithubProjectRepo = z.infer<typeof githubProjectRepoSchema>
