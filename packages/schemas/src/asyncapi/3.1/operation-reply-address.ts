import { object, optional, string } from '@scalar/validation'

import { recursiveRef } from './reference'

/** Operation Reply Address Object | Reference Object */
export const asyncApiOperationReplyAddressObject = recursiveRef(
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
)
