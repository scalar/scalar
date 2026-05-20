import { array, object, optional, string } from '@scalar/validation'

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
    typeComment:
      'Default selected OAuth scopes.\n\n@example\n```json\n{ "x-default-scopes": ["profile", "email"] }\n```',
  },
)
