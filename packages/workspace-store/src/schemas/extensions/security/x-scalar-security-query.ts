import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension set any query parameters for the OAuth authorize request
 *
 * @example
 * ```yaml
 * x-scalar-security-query: {
 *   prompt: 'consent',
 *   audience: 'scalar'
 * }
 * ```
 */
export const XScalarSecurityQuery = Type.Object({
  'x-scalar-security-query': Type.Optional(Type.Record(Type.String(), Type.String())),
})
