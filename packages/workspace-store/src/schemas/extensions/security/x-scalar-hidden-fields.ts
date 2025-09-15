import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to hide specific form fields in the OAuth2 authentication UI
 *
 * @example
 * ```yaml
 * x-scalar-hidden-fields: ['client-id', 'clientSecret']
 * ```
 */
export const XScalarHiddenFieldsSchema = Type.Object({
  'x-scalar-hidden-fields': Type.Optional(
    Type.Array(Type.Union([Type.Literal('client-id'), Type.Literal('clientSecret')])),
  ),
})
