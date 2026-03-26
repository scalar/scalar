import { Type } from '@scalar/typebox'
import { literal, object, optional, union } from '@scalar/validation'

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
export type XScalarCredentialsLocation = {
  'x-scalar-credentials-location'?: 'header' | 'body'
}

export const XScalarCredentialsLocation = object(
  {
    'x-scalar-credentials-location': optional(union([literal('header'), literal('body')])),
  },
  {
    typeName: 'XScalarCredentialsLocation',
    typeComment: 'Where OAuth2 credentials are sent',
  },
)
