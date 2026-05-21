import { literal, object, optional, union } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * An OpenAPI extension to specify where OAuth2 credentials should be sent.
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
export const XScalarCredentialsLocation = object(
  {
    'x-scalar-credentials-location': optional(
      union([literal('header'), literal('body')], {
        typeComment: 'Where OAuth2 credentials are sent (`header` or `body`)',
      }),
    ),
  },
  {
    typeName: 'XScalarCredentialsLocation',
    typeComment: typeCommentWithExample('Where OAuth2 credentials are sent for this security scheme.', {
      language: 'yaml',
      body: 'x-scalar-credentials-location: header',
    }),
  },
)
