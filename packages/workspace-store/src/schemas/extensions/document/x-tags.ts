import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

export const XTagsSchema = Type.Object({
  'x-tags': Type.Optional(Type.Array(Type.String())),
})

export type XTags = {
  'x-tags'?: string[]
}

export const XTags = object(
  {
    'x-tags': optional(array(string())),
  },
  {
    typeName: 'XTags',
    typeComment: 'Custom tag ordering or grouping hints for schema objects',
  },
)
