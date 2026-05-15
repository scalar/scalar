import { object, optional, string, union } from '@scalar/validation'

import { asyncApiReferenceObject } from './reference'

export const asyncApiCorrelationIdObject = union(
  [
    asyncApiReferenceObject,
    object(
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
    ),
  ],
  { typeName: 'AsyncApiCorrelationIdOrReference' },
)
