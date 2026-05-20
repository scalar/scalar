import { object, optional, record, string } from '@scalar/validation'

/**
 * An OpenAPI extension to set any additional body parameters for the OAuth token request.
 *
 * @example
 * ```yaml
 * x-scalar-security-body:
 *   audience: https://api.example.com
 *   resource: user-profile
 * ```
 */
export const XScalarSecurityBody = object(
  {
    'x-scalar-security-body': optional(
      record(string(), string(), {
        typeComment: 'Additional body parameters for the OAuth token request',
      }),
    ),
  },
  {
    typeName: 'XScalarSecurityBody',
    typeComment:
      'Additional OAuth token request body parameters.\n\n@example\n```yaml\nx-scalar-security-body:\n  audience: https://api.example.com\n  resource: user-profile\n```',
  },
)
