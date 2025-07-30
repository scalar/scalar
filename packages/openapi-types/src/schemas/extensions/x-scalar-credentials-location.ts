import { z } from 'zod'

/**
 * An OpenAPI extension to specify where OAuth2 credentials should be sent
 *
 * @example
 * ```yaml
 * x-scalar-credentials-location: header
 * ```
 *
 * @example
 * ```yaml
 * x-scalar-credentials-location: body
 * ```
 */
export const XScalarCredentialsLocationSchema = z.object({
  'x-scalar-credentials-location': z.enum(['header', 'body']).optional(),
})
