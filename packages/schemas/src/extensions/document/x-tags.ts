import { array, object, optional, string } from '@scalar/validation'

export const XTags = object(
  {
    'x-tags': optional(array(string())),
  },
  {
    typeName: 'XTags',
    typeComment: 'Custom tag ordering or grouping hints for schema objects',
  },
)
