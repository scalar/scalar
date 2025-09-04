import { Type } from '@scalar/typebox'

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
export const XScalarSecurityBody = Type.Object({
  'x-scalar-security-body': Type.Optional(Type.Record(Type.String(), Type.String())),
})
