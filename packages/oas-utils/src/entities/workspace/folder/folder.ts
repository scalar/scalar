import { nanoidSchema } from '@/entities/workspace/shared'
import { deepMerge } from '@/helpers'
import { z } from 'zod'

const folderSchema = z.object({
  /** Used for database sync only */
  uid: nanoidSchema,
  /** Will correspond to the slash separate path some, some/nested or some/nested/folder */
  name: z.string().optional().default('Folder'),
  /** Folder descriptions */
  description: z.string().optional(),
  /**
   * List of uids that correspond to requests or folders
   * WARNING: while uids are used we must check that corresponding $refs are not duplicated
   */
  childUids: z.array(z.string()).default([]),
})

/** Folders will correspond to the x- */
export type Folder = z.infer<typeof folderSchema>
export type FolderPayload = z.input<typeof folderSchema>

/** Create folder helper */
export const createFolder = (payload: FolderPayload) =>
  deepMerge(folderSchema.parse({}), payload)
