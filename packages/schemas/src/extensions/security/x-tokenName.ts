import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * An OpenAPI extension to specify a custom token name for OAuth2 flows.
 *
 * @example
 * ```yaml
 * x-tokenName: custom_access_token
 * ```
 */
export const XTokenName = object(
  {
    'x-tokenName': optional(
      string({
        typeComment: 'Custom field name for the OAuth2 access token in responses',
      }),
    ),
  },
  {
    typeName: 'XTokenName',
    typeComment: typeCommentWithExample('Custom OAuth2 access token field name.', {
      language: 'yaml',
      body: 'x-tokenName: custom_access_token',
    }),
  },
)
