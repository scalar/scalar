import { array, object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiServerVariableObjectInner = object(
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
          'An optional description for the server variable. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    examples: optional(array(string(), { typeComment: 'Examples of the server variable.' })),
  },
  { typeName: 'AsyncApiServerVariableObject' },
)

/**
 * Builds the Server Variable Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Server Variable Object | Reference Object`. Do not wrap the
 * result in `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiServerVariableObject = (maybeRef: MaybeRefFn) => maybeRef(asyncApiServerVariableObjectInner)

export const asyncApiServerVariableObject = createAsyncApiServerVariableObject(normalRef)
