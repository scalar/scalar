import { array, object, optional, string, union } from '@scalar/validation'

import { asyncApiReferenceObject } from './reference'

export const asyncApiServerVariableObject = union(
  [
    asyncApiReferenceObject,
    object(
      {
        enum: optional(array(string(), { typeComment: 'An enumeration of string values for substitution.' })),
        default: optional(
          string({
            typeComment:
              'The default value to use for substitution, and to send, if an alternate value is not supplied.',
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
    ),
  ],
  { typeName: 'AsyncApiServerVariableOrReference' },
)
