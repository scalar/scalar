import { z } from 'zod'

/**
 * An OpenAPI extension to specify a custom token name for OAuth2 flows
 *
 * @example
 * ```yaml
 * x-tokenName: 'custom_access_token'
 * ```
 */
export const XTokenName = z.object({
  'x-tokenName': z.string().optional(),
})
