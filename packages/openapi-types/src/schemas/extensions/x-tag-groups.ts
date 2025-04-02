import { z } from 'zod'

export const XTagGroupSchema = z.object({
  /**
   * The group name.
   */
  name: z.string(),
  /**
   * List of tags to include in this group.
   */
  tags: z.coerce.string().array().catch([]),
})

/**
 * x-tagGroups
 *
 * List of tags to include in this group.
 */
export const XTagGroupsSchema = XTagGroupSchema.array().catch([])
