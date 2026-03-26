import { Type } from '@scalar/typebox'
import { object, optional, record, string } from '@scalar/validation'

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
export const XScalarSecurityQuerySchema = Type.Object({
  'x-scalar-security-query': Type.Optional(Type.Record(Type.String(), Type.String())),
})

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
export type XScalarSecurityQuery = {
  'x-scalar-security-query'?: Record<string, string>
}

export const XScalarSecurityQuery = object(
  {
    'x-scalar-security-query': optional(record(string(), string())),
  },
  {
    typeName: 'XScalarSecurityQuery',
    typeComment: 'Additional OAuth authorize query parameters',
  },
)
