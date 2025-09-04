import { Type } from '@scalar/typebox'

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
