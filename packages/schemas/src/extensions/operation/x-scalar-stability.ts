import { literal, object, optional, union } from '@scalar/validation'

export const XScalarStabilityValues = {
  Deprecated: 'deprecated',
  Experimental: 'experimental',
  Stable: 'stable',
} as const

/**
 * An OpenAPI extension to indicate the stability of the operation
 *
 * @example
 * ```yaml
 * x-scalar-stability: deprecated
 * ```
 */
export const XScalarStability = object(
  {
    'x-scalar-stability': optional(
      union([literal('deprecated'), literal('experimental'), literal('stable')], {
        typeComment: 'Stability level of the operation',
      }),
    ),
  },
  {
    typeName: 'XScalarStability',
    typeComment: 'Stability of the operation in the Scalar UI',
  },
)
