import { z } from 'zod'

/**
 * An OpenAPI extension to specify additional request body parameters for OAuth2 flows
 *
 * @example
 * ```yaml
 * x-scalar-security-body:
 *   audience: 'https://api.example.com'
 *   custom_param: 'custom_value'
 * ```
 */
export const XScalarSecurityBody = z.object({
  'x-scalar-security-body': z.record(z.string()).optional(),
})
