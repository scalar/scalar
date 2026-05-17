import { object, optional, string } from '@scalar/validation'

export const XPreRequest = object(
  {
    'x-pre-request': optional(string()),
  },
  {
    typeName: 'XPreRequest',
    typeComment: 'Pre-request script for the operation',
  },
)
