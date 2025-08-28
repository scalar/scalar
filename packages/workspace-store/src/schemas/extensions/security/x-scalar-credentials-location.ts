import { Type } from '@scalar/typebox'

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
export const XScalarCredentialsLocationSchema = Type.Object({
  'x-scalar-credentials-location': Type.Optional(Type.Union([Type.Literal('header'), Type.Literal('body')])),
})
