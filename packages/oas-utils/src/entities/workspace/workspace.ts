import { themeIds } from '@scalar/themes'
import { z } from 'zod'

import { nanoidSchema } from './shared'

const workspaceSchema = z.object({
  uid: nanoidSchema,
  name: z.string().default('Default Workspace'),
  /** Workspace description */
  description: z.string().default('Basic Scalar Workspace'),
  /** Controls read only mode for most entitites, but not things like params */
  isReadOnly: z.boolean().default(false),
  /** List of all collection uids in a given workspace */
  collectionUids: z.array(z.string()).default([]),
  /** List of all environment uids in a given workspace */
  environmentUids: z.array(z.string()).default([]),
  /** List of all cookie uids in a given workspace */
  cookieUids: z.array(z.string()).default([]),
  /** Workspace level proxy for all requests to be sent through */
  proxyUrl: z.string().optional(),
  /** Workspace level theme, we might move this to user level later */
  themeId: z.enum(themeIds).optional().default('default'),
})

/** The base scalar workspace */
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspacePayload = z.input<typeof workspaceSchema>

export const createWorkspace = (payload: WorkspacePayload) =>
  workspaceSchema.parse(payload)
