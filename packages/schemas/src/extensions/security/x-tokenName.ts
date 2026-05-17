import { object, optional, string } from '@scalar/validation'

export const XTokenName = object(
  {
    'x-tokenName': optional(string()),
  },
  {
    typeName: 'XTokenName',
    typeComment: 'Custom token name for API key security schemes',
  },
)
