import { array, lazy, object, optional } from '@scalar/validation'

import { asyncApiOperationReplyAddressObject } from './operation-reply-address'
import { asyncApiReferenceObject, normalRef } from './reference'

/** Operation Reply Object | Reference Object */
export const asyncApiOperationReplyObject = lazy(() =>
  normalRef(
    object(
      {
        address: optional(asyncApiOperationReplyAddressObject),
        channel: optional(asyncApiReferenceObject),
        messages: optional(
          array(asyncApiReferenceObject, {
            typeComment:
              'List of $ref pointers to Message Objects used as reply payloads (Reference Objects only in the raw document).',
          }),
        ),
      },
      { typeName: 'AsyncApiOperationReplyObject' },
    ),
  ),
)
