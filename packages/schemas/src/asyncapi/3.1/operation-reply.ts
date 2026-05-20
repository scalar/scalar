import { array, lazy, object, optional } from '@scalar/validation'

import { createAsyncApiOperationReplyAddressObject } from './operation-reply-address'
import { type MaybeRefFn, asyncApiReferenceObject, normalRef } from './reference'

/**
 * Builds the Operation Reply Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Operation Reply Object | Reference Object`. The `address` field
 * uses {@link createAsyncApiOperationReplyAddressObject}, which is already a reference union.
 * Do not wrap the return value in `maybeRef` again.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiOperationReplyObject = (maybeRef: MaybeRefFn) => {
  const replyAddress = createAsyncApiOperationReplyAddressObject(maybeRef)

  return lazy(() =>
    maybeRef(
      object(
        {
          address: optional(replyAddress),
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
}

export const asyncApiOperationReplyObject = createAsyncApiOperationReplyObject(normalRef)
