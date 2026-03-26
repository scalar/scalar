import { Type } from '@scalar/typebox'
import { literal, object, optional, union } from '@scalar/validation'

export const XScalarStabilityValues = {
  Deprecated: 'deprecated',
  Experimental: 'experimental',
  Stable: 'stable',
} as const

export type XScalarStabilityValues = (typeof XScalarStabilityValues)[keyof typeof XScalarStabilityValues]

/**
 * An OpenAPI extension to indicate the stability of the operation
 *
 * @example
 * ```yaml
 * x-scalar-stability: deprecated
 * ```
 */
export const XScalarStabilitySchema = Type.Object({
  'x-scalar-stability': Type.Optional(
    Type.Union([Type.Literal('deprecated'), Type.Literal('experimental'), Type.Literal('stable')]),
  ),
})

export type XScalarStability = {
  /**
   * An OpenAPI extension to indicate the stability of the operation
   *
   * @example
   * ```yaml
   * x-scalar-stability: deprecated
   * ```
   */
  'x-scalar-stability'?: XScalarStabilityValues
}

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
