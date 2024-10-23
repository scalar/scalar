import { openapi } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { type Context, Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'

import { mockAnyResponse } from './routes/mockAnyResponse'
import { respondWithOpenApiDocument } from './routes/respondWithOpenApiDocument'
import type { HttpMethod, MockServerOptions } from './types'
import { getOperations } from './utils/getOperations'
import { honoRouteFromPath } from './utils/honoRouteFromPath'
import { isAuthenticationRequired } from './utils/isAuthenticationRequired'
import { logAuthenticationInstructions } from './utils/logAuthenticationInstructions'
import { setupAuthenticationRoutes } from './utils/setupAuthenticationRoutes'

/**
 * Create a mock server instance
 */
export async function createMockServer(options: MockServerOptions) {
  const app = new Hono()

  /** Dereferenced OpenAPI document */
  const { schema } = await openapi()
    .load(options?.specification ?? {})
    .dereference()
    .get()

  // CORS headers
  app.use(cors())

  // OpenAPI JSON file
  app.get('/openapi.json', (c) =>
    respondWithOpenApiDocument(c, options?.specification, 'json'),
  )

  // OpenAPI YAML file
  app.get('/openapi.yaml', (c) =>
    respondWithOpenApiDocument(c, options?.specification, 'yaml'),
  )

  /** Paths specified in the OpenAPI document */
  const paths = schema?.paths ?? {}

  // Set up security methods defined in the specification
  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> =
    schema?.components?.securitySchemes || {}

  setupAuthenticationRoutes(app, schema)
  logAuthenticationInstructions(securitySchemes)

  Object.keys(paths).forEach((path) => {
    const methods = Object.keys(getOperations(paths[path])) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const route = honoRouteFromPath(path)

      const operation = schema?.paths?.[path]?.[method] as OpenAPI.Operation

      // Check if authentication is required for this operation
      const requiresAuthentication = isAuthenticationRequired(
        operation.security,
      )

      // Check if authentication is required for this operation
      if (requiresAuthentication) {
        app[method](route, async (c, next) => {
          const operationSecuritySchemes =
            operation.security || schema?.security

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

                        if (authHeader && authHeader.startsWith('Basic ')) {
                          isAuthenticated = true
                        }
                      } else if (scheme.scheme === 'bearer') {
                        const authHeader = c.req.header('Authorization')

                        if (authHeader && authHeader.startsWith('Bearer ')) {
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
                        const apiKey = getCookie(scheme.name)

                        if (apiKey) {
                          isAuthenticated = true
                        }
                      }
                      break
                    case 'oauth2':
                      // Handle OAuth 2.0 flows, including password grant
                      if (
                        c.req.header('Authorization')?.startsWith('Bearer ')
                      ) {
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
        })
      }

      // // Check if authentication is required
      // const requiresAuthentication = isAuthenticationRequired(
      //   operation.security,
      // )

      // // Check whether we need basic authentication
      // const requiresBasicAuthentication = isBasicAuthenticationRequired(
      //   operation,
      //   schema,
      // )
      // // Add HTTP basic authentication
      // if (requiresAuthentication && requiresBasicAuthentication) {
      //   app[method](route, anyBasicAuthentication())
      // }
      // // Check whether we need OpenAuth password grant authentication
      // const requiresOpenAuthPasswordGrant = isOpenAuthPasswordGrantRequired(
      //   operation,
      //   schema,
      // )

      // // Add HTTP basic authentication
      // if (requiresAuthentication && requiresOpenAuthPasswordGrant) {
      //   app[method](route, anyOpenAuthPasswordGrantAuthentication())
      // }

      // // Check whether we need OAuth 2.0 Authorization Code flow authentication
      // const requiresOpenAuthCodeFlow = isOpenAuthCodeFlowRequired(
      //   operation,
      //   schema,
      // )

      // // Add OAuth 2.0 Authorization Code flow authentication
      // if (requiresAuthentication && requiresOpenAuthCodeFlow) {
      //   app[method](route, anyOpenAuthCodeFlowAuthentication())
      // }

      // Route
      app[method](route, (c: Context) => mockAnyResponse(c, operation, options))
    })
  })

  return app
}
