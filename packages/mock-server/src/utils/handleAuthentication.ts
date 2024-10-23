import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

/**
 * Handles authentication for incoming requests based on the OpenAPI specification.
 */
export function handleAuthentication(
  schema?: OpenAPI.Document,
  operation?: OpenAPI.Operation,
) {
  return async (c: Context, next: () => Promise<void>) => {
    const operationSecuritySchemes = operation?.security || schema?.security

    if (operationSecuritySchemes && operationSecuritySchemes.length > 0) {
      let isAuthenticated = false

      for (const securityRequirement of operationSecuritySchemes) {
        for (const [schemeName] of Object.entries(securityRequirement)) {
          const scheme = schema?.components?.securitySchemes?.[schemeName]

          if (scheme) {
            switch (scheme.type) {
              case 'http':
                if (scheme.scheme === 'basic') {
                  const authHeader = c.req.header('Authorization')

                  if (authHeader?.startsWith('Basic ')) {
                    isAuthenticated = true
                  }
                } else if (scheme.scheme === 'bearer') {
                  const authHeader = c.req.header('Authorization')

                  if (authHeader?.startsWith('Bearer ')) {
                    isAuthenticated = true
                  }
                }
                break
              case 'apiKey':
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
                // Handle OAuth 2.0 flows, including password grant
                if (c.req.header('Authorization')?.startsWith('Bearer ')) {
                  isAuthenticated = true
                }

                break
            }
          }

          if (isAuthenticated) break
        }
        if (isAuthenticated) break
      }

      if (!isAuthenticated) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    // If all checks pass, continue to the next middleware
    await next()
  }
}
