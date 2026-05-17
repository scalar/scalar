import { object, optional, string } from '@scalar/validation'

export const XDisplayName = object(
  {
    'x-displayName': optional(string()),
  },
  {
    typeName: 'XDisplayName',
    typeComment: 'Display name override for a tag',
  },
)
