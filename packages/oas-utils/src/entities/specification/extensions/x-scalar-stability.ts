import { XScalarStability } from '@scalar/types'
import { z } from 'zod'

/**
 * An OpenAPI extension to indicate the stability of the operation
 *
 * @example
 * ```yaml
 * x-scalar-stability: deprecated
 * ```
 */
export const ScalarStabilitySchema = z.object({
  'x-scalar-stability': z
    .enum([XScalarStability.Deprecated, XScalarStability.Experimental, XScalarStability.Stable])
    .optional()
    .catch(undefined),
})
