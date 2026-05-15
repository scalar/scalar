import { array, object, optional, string, union } from '@scalar/validation'

import { asyncApiReferenceObject } from './reference'

export const asyncApiParameterObject = union(
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
              'An optional description for the parameter. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        examples: optional(array(string(), { typeComment: 'Examples of the parameter value.' })),
        location: optional(
          string({ typeComment: 'A runtime expression that specifies the location of the parameter value.' }),
        ),
      },
      { typeName: 'AsyncApiParameterObject' },
    ),
  ],
  { typeName: 'AsyncApiParameterOrReference' },
)
