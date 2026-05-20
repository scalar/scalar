import { object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiCorrelationIdObjectInner = object(
  {
    description: optional(
      string({
        typeComment:
          'An optional description of the identifier. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    location: string({
      typeComment: 'REQUIRED. A runtime expression that specifies the location of the correlation ID.',
    }),
  },
  { typeName: 'AsyncApiCorrelationIdObject' },
)

/**
 * Builds the Correlation ID Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Correlation ID Object | Reference Object`. Do not wrap the
 * result in `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiCorrelationIdObject = (maybeRef: MaybeRefFn) => maybeRef(asyncApiCorrelationIdObjectInner)

export const asyncApiCorrelationIdObject = createAsyncApiCorrelationIdObject(normalRef)
