import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

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

export const XTokenName = object(
  {
    'x-tokenName': optional(string()),
  },
  {
    typeName: 'XTokenName',
    typeComment: 'Custom OAuth2 access token field name',
  },
)
