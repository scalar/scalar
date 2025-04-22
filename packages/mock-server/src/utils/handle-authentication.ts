import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

/**
 * Handles authentication for incoming requests based on the OpenAPI specification.
 */
export function handleAuthentication(schema?: OpenAPI.Document, operation?: OpenAPI.Operation) {
  return async (c: Context, next: () => Promise<void>): Promise<Response | void> => {
    const operationSecuritySchemes = operation?.security || schema?.security

    if (operationSecuritySchemes && operationSecuritySchemes.length > 0) {
      let isAuthenticated = false
      let authScheme = ''

      for (const securityRequirement of operationSecuritySchemes) {
        let securitySchemeAuthenticated = true

        for (const [schemeName] of Object.entries(securityRequirement)) {
          const scheme = schema?.components?.securitySchemes?.[schemeName]

          if (scheme) {
            switch (scheme.type) {
              case 'http':
                if (scheme.scheme === 'basic') {
                  authScheme = 'Basic'
                  const authHeader = c.req.header('Authorization')

                  if (authHeader?.startsWith('Basic ')) {
                    isAuthenticated = true
                  }
                } else if (scheme.scheme === 'bearer') {
                  authScheme = 'Bearer'
                  const authHeader = c.req.header('Authorization')

                  if (authHeader?.startsWith('Bearer ')) {
                    isAuthenticated = true
                  }
                }
                break
              case 'apiKey':
                authScheme = `ApiKey ${scheme.name}`

                if (scheme.in === 'header') {
                  const apiKey = c.req.header(scheme.name)
                  if (apiKey) {
                    isAuthenticated = true
                  }
                } else if (scheme.in === 'query') {
                  const apiKey = c.req.query(scheme.name)

                  if (apiKey) {
                    isAuthenticated = true
                  }
                } else if (scheme.in === 'cookie') {
                  const apiKey = getCookie(c, scheme.name)

                  if (apiKey) {
                    isAuthenticated = true
                  }
                }
                break
              case 'oauth2':
                authScheme = 'Bearer'
                // Handle OAuth 2.0 flows, including password grant
                if (c.req.header('Authorization')?.startsWith('Bearer ')) {
                  isAuthenticated = true
                }
                break
              case 'openIdConnect':
                authScheme = 'Bearer'
                // Handle OpenID Connect similar to OAuth2
                if (c.req.header('Authorization')?.startsWith('Bearer ')) {
                  isAuthenticated = true
                }
                break
            }
          }

          if (!isAuthenticated) {
            securitySchemeAuthenticated = false
            break
          }
        }

        if (securitySchemeAuthenticated) {
          isAuthenticated = true
          break
        }
      }

      if (!isAuthenticated) {
        let wwwAuthenticateValue = authScheme

        switch (authScheme) {
          case 'Basic':
            wwwAuthenticateValue += ' realm="Scalar Mock Server", charset="UTF-8"'
            break
          case 'Bearer':
            wwwAuthenticateValue +=
              ' realm="Scalar Mock Server", error="invalid_token", error_description="The access token is invalid or has expired"'
            break
          case 'ApiKey':
            wwwAuthenticateValue += ` realm="Scalar Mock Server", error="invalid_token", error_description="Invalid or missing API key"`
            break
          default:
            wwwAuthenticateValue = 'Bearer realm="Scalar Mock Server"'
        }

        c.header('WWW-Authenticate', wwwAuthenticateValue)
        return c.json(
          {
            error: 'Unauthorized',
            message: 'Authentication is required to access this resource.',
          },
          401,
        )
      }
    }

    // If all checks pass, continue to the next middleware
    await next()
  }
}
