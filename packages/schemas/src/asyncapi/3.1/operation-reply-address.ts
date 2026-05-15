import { object, optional, string, union } from '@scalar/validation'

import { asyncApiReferenceObject } from './reference'

export const asyncApiOperationReplyAddressObject = union(
  [
    asyncApiReferenceObject,
    object(
      {
        description: optional(
          string({
            typeComment:
              'An optional description of the address. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        location: string({
          typeComment: 'REQUIRED. A runtime expression that specifies the location of the reply address.',
        }),
      },
      { typeName: 'AsyncApiOperationReplyAddressObject' },
    ),
  ],
  { typeName: 'AsyncApiOperationReplyAddressOrReference' },
)
