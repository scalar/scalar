import { object, optional, string } from '@scalar/validation'

import { recursiveRef } from './reference'

/** Correlation ID Object | Reference Object */
export const asyncApiCorrelationIdObject = recursiveRef(
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
)
