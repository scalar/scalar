import { object, optional, string } from '@scalar/validation'

export const XPostResponse = object(
  {
    'x-post-response': optional(
      string({
        typeComment: 'Post-response script for the operation',
      }),
    ),
  },
  {
    typeName: 'XPostResponse',
    typeComment: 'Post-response script for the operation',
  },
)
