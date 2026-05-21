import { literal, object, optional, union } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarStabilityValues = {
  Deprecated: 'deprecated',
  Experimental: 'experimental',
  Stable: 'stable',
} as const

export const XScalarStability = object(
  {
    'x-scalar-stability': optional(
      union([literal('deprecated'), literal('experimental'), literal('stable')], {
        typeComment: 'Stability level: `deprecated`, `experimental`, or `stable`',
      }),
    ),
  },
  {
    typeName: 'XScalarStability',
    typeComment: typeCommentWithExample('Indicates the stability of an operation in the Scalar UI.', {
      language: 'yaml',
      body: 'x-scalar-stability: deprecated',
    }),
  },
)
