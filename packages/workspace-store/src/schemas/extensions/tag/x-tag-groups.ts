import { Type } from '@scalar/typebox'

export const XTagGroupSchema = Type.Object({
  /**
   * The group name.
   */
  name: Type.String(),
  /**
   * List of tags to include in this group.
   */
  tags: Type.Array(Type.String()),
})

/**
 * x-tagGroups
 *
 * List of tags to include in this group.
 */
export const XTagGroupsSchema = Type.Object({
  'x-tagGroups': Type.Optional(Type.Array(XTagGroupSchema)),
})
