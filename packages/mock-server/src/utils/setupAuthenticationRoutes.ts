import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Hono } from 'hono'

import { respondWithAuthorizePage } from '@/routes/respondWithAuthorizePage'
import { respondWithToken } from '@/routes/respondWithToken'

import { getOpenAuthTokenUrls, getPathFromUrl } from './getOpenAuthTokenUrls'

/**
 * Helper function to set up authentication routes for OAuth 2.0 flows
 */
export function setupAuthenticationRoutes(app: Hono, schema?: OpenAPI.Document) {
  const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject> =
    schema?.components?.securitySchemes || {}

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
  const authorizeUrls = new Set<string>()
  const tokenUrls = new Set<string>()

  Object.entries(securitySchemes).forEach(([_, scheme]) => {
    if (scheme.type === 'oauth2') {
      if (scheme.flows?.authorizationCode) {
        const authorizeRoute = scheme.flows.authorizationCode.authorizationUrl ?? '/oauth/authorize'
        const tokenRoute = scheme.flows.authorizationCode.tokenUrl ?? '/oauth/token'

        authorizeUrls.add(getPathFromUrl(authorizeRoute))
        tokenUrls.add(tokenRoute)
      }

      if (scheme.flows?.implicit) {
        const authorizeRoute = scheme.flows.implicit.authorizationUrl ?? '/oauth/authorize'
        authorizeUrls.add(getPathFromUrl(authorizeRoute))
      }

      if (scheme.flows?.password) {
        const tokenRoute = scheme.flows.password.tokenUrl ?? '/oauth/token'
        tokenUrls.add(tokenRoute)
      }

      if (scheme.flows?.clientCredentials) {
        const tokenRoute = scheme.flows.clientCredentials.tokenUrl ?? '/oauth/token'
        tokenUrls.add(tokenRoute)
      }
    } else if (scheme.type === 'openIdConnect') {
      // Handle OpenID Connect configuration
      if (scheme.openIdConnectUrl) {
        const configPath = getPathFromUrl(scheme.openIdConnectUrl ?? '/.well-known/openid-configuration')

        // Add route for OpenID Connect configuration
        app.get(configPath, (c) => {
          return c.json({
            issuer: 'https://example.com',
            authorization_endpoint: '/oauth/authorize',
            token_endpoint: '/oauth/token',
            response_types_supported: ['code', 'token', 'id_token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
          })
        })

        // Add standard endpoints
        const authorizeRoute = '/oauth/authorize'
        const tokenRoute = '/oauth/token'

        authorizeUrls.add(getPathFromUrl(authorizeRoute))
        tokenUrls.add(tokenRoute)
      }
    }
  })

  // Set up unique authorization routes
  authorizeUrls.forEach((authorizeUrl) => {
    app.get(authorizeUrl, (c) => respondWithAuthorizePage(c, schema?.info?.title))
  })

  // Set up unique token routes
  tokenUrls.forEach((tokenUrl) => {
    app.post(tokenUrl, respondWithToken)
  })
}
