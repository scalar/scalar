import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Hono } from 'hono'

import { respondWithAuthorizePage } from '../routes/respondWithAuthorizePage'
import { respondWithToken } from '../routes/respondWithToken'
import { getOpenAuthTokenUrls } from './getOpenAuthTokenUrls'

/**
 * Helper function to set up authentication routes for OAuth 2.0 flows
 */
export function setupAuthenticationRoutes(
  app: Hono,
  schema?: OpenAPI.Document,
) {
  const securitySchemes: Record<
    string,
    OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject
  > = schema?.components?.securitySchemes || {}

  // Set up authentication routes for OAuth 2.0 flows
  getOpenAuthTokenUrls(schema).forEach((tokenUrl) => {
    app.post(tokenUrl, (c) => {
      return c.json(
        {
          access_token: 'super-secret-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'example-refresh-token',
        },
        200,
        {
          /**
           * When responding with an access token, the server must also include the additional
           * Cache-Control: no-store HTTP header to ensure clients do not cache this request.
           *
           * @see https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
           */
          'Cache-Control': 'no-store',
        },
      )
    })
  })

  // Set up routes for different OAuth 2.0 flows
  Object.entries(securitySchemes).forEach(([_, scheme]) => {
    if (scheme.type === 'oauth2') {
      if (scheme.flows?.authorizationCode) {
        const authorizeRoute =
          scheme.flows.authorizationCode.authorizationUrl ?? '/oauth/authorize'
        const tokenRoute =
          scheme.flows.authorizationCode.tokenUrl ?? '/oauth/token'

        app.get(authorizeRoute, respondWithAuthorizePage)
        app.post(tokenRoute, respondWithToken)
      }

      if (scheme.flows?.implicit) {
        const authorizeRoute =
          scheme.flows.implicit.authorizationUrl ?? '/oauth/authorize'
        app.get(authorizeRoute, respondWithAuthorizePage)
      }

      if (scheme.flows?.password || scheme.flows?.clientCredentials) {
        const tokenRoute =
          (scheme.flows.password?.tokenUrl ||
            scheme.flows.clientCredentials?.tokenUrl) ??
          '/oauth/token'
        app.post(tokenRoute, respondWithToken)
      }
    }
  })
}
