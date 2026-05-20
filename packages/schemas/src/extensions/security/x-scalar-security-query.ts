import { object, optional, record, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

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
    typeComment: typeCommentWithExample('Additional OAuth authorize query parameters.', {
      language: 'yaml',
      body: `x-scalar-security-query:
  prompt: consent
  audience: scalar`,
    }),
  },
)
