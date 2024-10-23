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

  // Simulate token generation
  const tokenResponse = {
    access_token: EXAMPLE_ACCESS_TOKEN,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'example-refresh-token',
  }

  return c.json(tokenResponse)
}
