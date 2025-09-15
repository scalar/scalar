import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to hide specific form fields in the authentication UI
 * Can be used for OAuth2 flows, API keys, and other security schemes
 *
 * @example
 * ```yaml
 * # For OAuth2 flows
 * x-scalar-hidden-fields: ['client-id', 'client-secret']
 *
 * # For API key
 * x-scalar-hidden-fields: ['api-key']
 * ```
 */
export const XScalarHiddenFieldsSchema = Type.Object({
  'x-scalar-hidden-fields': Type.Optional(
    Type.Array(
      Type.Union([
        // OAuth2 fields
        Type.Literal('client-id'),
        Type.Literal('client-secret'),
        // API key fields
        Type.Literal('api-key'),
        // HTTP auth fields
        Type.Literal('username'),
        Type.Literal('password'),
        Type.Literal('token'),
      ]),
    ),
  ),
})
