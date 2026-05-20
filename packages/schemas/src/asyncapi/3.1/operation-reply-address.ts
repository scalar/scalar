import { object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiOperationReplyAddressObjectInner = object(
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
)

/**
 * Builds the Operation Reply Address Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Operation Reply Address Object | Reference Object`. Do not
 * wrap the result in `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiOperationReplyAddressObject = (maybeRef: MaybeRefFn) =>
  maybeRef(asyncApiOperationReplyAddressObjectInner)

export const asyncApiOperationReplyAddressObject = createAsyncApiOperationReplyAddressObject(normalRef)
