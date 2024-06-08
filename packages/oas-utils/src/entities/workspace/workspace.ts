import { z } from 'zod'

import { nanoidSchema } from './shared'

/**
 * The base scalar workspace
 */
export type Workspace = z.infer<typeof workspaceSchema>
export const workspaceSchema = z.object({
  uid: nanoidSchema,
  name: z.string().default('Default Workspace'),
  description: z.string().default('Basic Scalar Workspace'),
  /** List of all collection uids in a given workspace */
  collectionUids: z.array(z.string()),
  /** List of all environment uids in a given workspace */
  environmentUids: z.array(z.string()),
  /** List of all cookie uids in a given workspace */
  cookieUids: z.array(z.string()),
})
