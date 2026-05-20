import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Default selected scopes for the OAuth flow.
 *
 * @example
 * ```json
 * {
 *   "x-default-scopes": ["profile", "email"]
 * }
 * ```
 */
export const XDefaultScopes = object(
  {
    'x-default-scopes': optional(
      array(string(), {
        typeComment: 'Scopes pre-selected in the OAuth consent UI',
      }),
    ),
  },
  {
    typeName: 'XDefaultScopes',
    typeComment: typeCommentWithExample('Default selected OAuth scopes.', {
      language: 'json',
      body: '{ "x-default-scopes": ["profile", "email"] }',
    }),
  },
)
