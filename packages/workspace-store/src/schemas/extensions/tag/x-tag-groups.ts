import { Type } from '@scalar/typebox'
import { array, intersection, object, optional, string } from '@scalar/validation'

import { compose } from '@/schemas/compose'
import {
  type XScalarOrder,
  XScalarOrder as XScalarOrderFields,
  XScalarOrderSchema,
} from '@/schemas/extensions/general/x-scalar-order'

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

export type XTagGroup = {
  /**
   * The group name.
   */
  name: string
  /**
   * List of tags to include in this group.
   */
  tags: string[]
} & XScalarOrder

export const XTagGroup = intersection(
  [
    object(
      {
        name: string({ typeComment: 'The group name.' }),
        tags: array(string(), { typeComment: 'List of tags to include in this group.' }),
      },
      {
        typeName: 'XTagGroupBase',
      },
    ),
    XScalarOrderFields,
  ],
  {
    typeName: 'XTagGroup',
    typeComment: 'A tag group with optional custom ordering',
  },
)

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

export const XTagGroups = object(
  {
    'x-tagGroups': optional(
      array(XTagGroup, {
        typeComment: 'Tag groups for organizing tags in the UI',
      }),
    ),
  },
  {
    typeName: 'XTagGroups',
    typeComment: 'Groups of tags for the OpenAPI document',
  },
)
