import { object, optional, record, string } from '@scalar/validation'

/**
 * An OpenAPI extension to set any query parameters for the OAuth authorize request.
 *
 * @example
 * ```yaml
 * x-scalar-security-query:
 *   prompt: consent
 *   audience: scalar
 * ```
 */
export const XScalarSecurityQuery = object(
  {
    'x-scalar-security-query': optional(
      record(string(), string(), {
        typeComment: 'Additional query parameters for the OAuth authorize request',
      }),
    ),
  },
  {
    typeName: 'XScalarSecurityQuery',
    typeComment:
      'Additional OAuth authorize query parameters.\n\n@example\n```yaml\nx-scalar-security-query:\n  prompt: consent\n  audience: scalar\n```',
  },
)
