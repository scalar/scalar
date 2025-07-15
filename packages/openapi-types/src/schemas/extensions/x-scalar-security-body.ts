import { z } from 'zod'

/**
 * An OpenAPI extension to set any additional body parameters for the OAuth token request
 *
 * @example
 * ```yaml
 * x-scalar-security-body: {
 *   audience: 'https://api.example.com',
 *   resource: 'user-profile'
 * }
 * ```
 */
export const XScalarSecurityBody = z.object({
  'x-scalar-security-body': z.record(z.string(), z.string()).optional(),
})
