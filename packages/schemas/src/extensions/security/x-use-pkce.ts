import { literal, object, union } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Use `x-usePkce` to enable Proof Key for Code Exchange (PKCE) for the OAuth2 authorization code flow.
 */
export const XusePkce = object(
  {
    'x-usePkce': union([literal('no'), literal('SHA-256'), literal('plain')], {
      typeComment: 'PKCE mode: `SHA-256`, `plain`, or `no` (disabled)',
    }),
  },
  {
    typeName: 'XusePkce',
    typeComment: typeCommentWithExample(
      'Enables Proof Key for Code Exchange (PKCE) for the OAuth2 authorization code flow.',
      { language: 'yaml', body: 'x-usePkce: SHA-256' },
    ),
  },
)
