import { z } from 'zod'

/**
 * An OpenAPI extension set any query parameters for the OAuth authorize request
 *
 * @example
 * ```yaml
 * x-scalar-security-query: {
 *   prompt: 'consent',
 *   audience: 'scalar'
 * }
 * ```
 */
export const XScalarSecurityQuery = z.object({
  'x-scalar-security-query': z.record(z.string(), z.string()).optional(),
})
