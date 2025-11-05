import type { Context } from 'hono'

/** Always responds with this token */
const EXAMPLE_ACCESS_TOKEN = 'super-secret-access-token'

/**
 * Responds with a JSON object simulating an OAuth 2.0 token response.
 */
export function respondWithToken(c: Context) {
  const grantType = c.req.query('grant_type')

  if (!grantType) {
    return c.json(
      {
        error: 'invalid_request',
        error_description: 'Missing grant_type parameter',
      },
      400,
    )
  }

  // Validate supported grant types
  const supportedGrantTypes = ['authorization_code', 'client_credentials', 'refresh_token']

  if (!supportedGrantTypes.includes(grantType)) {
    return c.json(
      {
        error: 'unsupported_grant_type',
        error_description: `Grant type must be one of: ${supportedGrantTypes.join(', ')}`,
      },
      400,
    )
  }

  // Validate required parameters for each grant type
  if (grantType === 'authorization_code' && !c.req.query('code')) {
    return c.json(
      {
        error: 'invalid_request',
        error_description: 'Missing code parameter',
      },
      400,
    )
  }

  // Simulate token generation
  const tokenResponse = {
    access_token: EXAMPLE_ACCESS_TOKEN,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'example-refresh-token',
    scope: c.req.query('scope') ?? 'read write',
  }

  // Security headers
  c.header('Cache-Control', 'no-store')
  c.header('Pragma', 'no-cache')

  return c.json(tokenResponse)
}
