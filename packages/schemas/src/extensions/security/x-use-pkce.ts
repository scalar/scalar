import { literal, object, union } from '@scalar/validation'

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
    typeComment:
      'Enables Proof Key for Code Exchange (PKCE) for the OAuth2 authorization code flow.\n\n@example\n```yaml\nx-usePkce: SHA-256\n```',
  },
)
