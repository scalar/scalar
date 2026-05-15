import { array, lazy, object, optional, union } from '@scalar/validation'

import { asyncApiOperationReplyAddressObject } from './operation-reply-address'
import { asyncApiReferenceObject, normalRef } from './reference'

export const asyncApiOperationReplyObject = lazy(() =>
  union(
    [
      asyncApiReferenceObject,
      object(
        {
          address: optional(normalRef(asyncApiOperationReplyAddressObject)),
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
    ],
    { typeName: 'AsyncApiOperationReplyOrReference' },
  ),
)
