import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { type XScalarOrder, XScalarOrderSchema } from '@/schemas/extensions/general/x-scalar-order'

const XTagGroupSchema = compose(
  Type.Object({
    /**
     * The group name.
     */
    name: Type.String(),
    /**
     * List of tags to include in this group.
     */
    tags: Type.Array(Type.String()),
  }),
  XScalarOrderSchema,
)

type XTagGroup = {
  /**
   * The group name.
   */
  name: string
  /**
   * List of tags to include in this group.
   */
  tags: string[]
} & XScalarOrder

/**
 * x-tagGroups
 *
 * List of tags to include in this group.
 */
export const XTagGroupsSchema = Type.Object({
  'x-tagGroups': Type.Optional(Type.Array(XTagGroupSchema)),
})

export type XTagGroups = {
  /**
   * x-tagGroups
   *
   * List of tags to include in this group.
   */
  'x-tagGroups'?: XTagGroup[]
}
