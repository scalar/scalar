import { z } from 'zod'

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
export const XScalarStabilitySchema = z.object({
  'x-scalar-stability': z
    .enum(Object.values(XScalarStabilityValues) as [string, ...string[]])
    .optional()
    .catch(undefined),
})
