import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to specify a custom token name for OAuth2 flows
 *
 * @example
 * ```yaml
 * x-tokenName: 'custom_access_token'
 * ```
 */
export const XTokenNameSchema = Type.Object({
  'x-tokenName': Type.Optional(Type.String()),
})

/**
 * An OpenAPI extension to specify a custom token name for OAuth2 flows
 *
 * @example
 * ```yaml
 * x-tokenName: 'custom_access_token'
 * ```
 */
export type XTokenName = {
  'x-tokenName'?: string
}
