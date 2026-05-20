import { literal, object, optional, union } from '@scalar/validation'

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
    typeComment:
      'Indicates the stability of an operation in the Scalar UI.\n\n@example\n```yaml\nx-scalar-stability: deprecated\n```',
  },
)
