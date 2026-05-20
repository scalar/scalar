import { array, object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiParameterObjectInner = object(
  {
    enum: optional(array(string(), { typeComment: 'An enumeration of string values for substitution.' })),
    default: optional(
      string({
        typeComment: 'The default value to use for substitution, and to send, if an alternate value is not supplied.',
      }),
    ),
    description: optional(
      string({
        typeComment:
          'An optional description for the parameter. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    examples: optional(array(string(), { typeComment: 'Examples of the parameter value.' })),
    location: optional(
      string({ typeComment: 'A runtime expression that specifies the location of the parameter value.' }),
    ),
  },
  { typeName: 'AsyncApiParameterObject' },
)

/**
 * Builds the Parameter Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Parameter Object | Reference Object`. Do not wrap the result in
 * `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiParameterObject = (maybeRef: MaybeRefFn) => maybeRef(asyncApiParameterObjectInner)

export const asyncApiParameterObject = createAsyncApiParameterObject(normalRef)
