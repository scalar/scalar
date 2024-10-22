import { openapi } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'

import { mockAnyResponse } from './routes/mockAnyResponse'
import { respondWithAuthorizePage } from './routes/respondWithAuthorizePage'
import { respondWithOpenApiDocument } from './routes/respondWithOpenApiDocument'
import type { HttpMethod, MockServerOptions } from './types'
// import { anyBasicAuthentication } from './utils/anyBasicAuthentication'
// import { anyOpenAuthCodeFlowAuthentication } from './utils/anyOpenAuthCodeFlowAuthentication'
// import { anyOpenAuthPasswordGrantAuthentication } from './utils/anyOpenAuthPasswordGrantAuthentication'
// import { getOpenAuthTokenUrl } from './utils/getOpenAuthTokenUrl'
import { getOperations } from './utils/getOperations'
import { honoRouteFromPath } from './utils/honoRouteFromPath'
import { isAuthenticationRequired } from './utils/isAuthenticationRequired'

// import { isBasicAuthenticationRequired } from './utils/isBasicAuthenticationRequired'
// import { isOpenAuthCodeFlowRequired } from './utils/isOpenAuthCodeFlowRequired'
// import { isOpenAuthPasswordGrantRequired } from './utils/isOpenAuthPasswordGrantRequired'

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

  //   // OpenAuth2 token endpoint
  //   const tokenUrl = getOpenAuthTokenUrl(schema)

  //   if (typeof tokenUrl === 'string') {
  //     app.post(tokenUrl, async (c) => {
  //       return c.json(
  //         {
  //           access_token: 'super-secret-token',
  //           token_type: 'Bearer',
  //           expires_in: 3600,
  //           refresh_token: 'secret-refresh-token',
  //         },
  //         200,
  //         /**
  //          * When responding with an access token, the server must also include the additional Cache-Control: no-store
  //          * HTTP header to ensure clients do not cache this request.
  //          * @see https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
  //          */
  //         {
  //           'Cache-Control': 'no-store',
  //         },
  //       )
  //     })

  /** Paths specified in the OpenAPI document */
  const paths = schema?.paths ?? {}

  // Set up security methods defined in the specification
  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> =
    schema?.components?.securitySchemes || {}

  console.log('Security Schemes:')
  console.log()

  Object.entries(securitySchemes).forEach(([_, scheme]) => {
    switch (scheme.type) {
      case 'apiKey':
        // TODO: Set up API Key authentication
        if (scheme.in === 'header') {
          console.log(`✅ API Key Authentication (Header: ${scheme.name})`)
          // TODO: Implement header-based API key validation
        } else if (scheme.in === 'query') {
          console.log(
            `✅ API Key Authentication (Query Parameter: ${scheme.name})`,
          )
          // TODO: Implement query parameter-based API key validation
        } else if (scheme.in === 'cookie') {
          console.log(`✅ API Key Authentication (Cookie: ${scheme.name})`)
          // TODO: Implement cookie-based API key validation
        } else {
          console.error(`❌ Unsupported API Key Location: ${scheme.in}`)
        }
        break
      case 'http':
        if (scheme.scheme === 'basic') {
          // TODO: Set up HTTP Basic authentication
          console.log('✅ HTTP Basic Authentication')
          console.log('   Use any credentials')
          console.log()
        } else if (scheme.scheme === 'bearer') {
          // TODO: Set up Bearer token authentication
          console.log('✅ Bearer Token Authentication')
          console.log('   Use any bearer token header')
          console.log()
          console.log('   Authorization: Bearer YOUR_TOKEN_HERE')
          console.log()
        } else {
          console.error('❌ Unknown Security Scheme:', scheme)
        }

        break
      case 'oauth2':
        if (scheme.flows) {
          Object.keys(scheme.flows).forEach((flow) => {
            switch (flow) {
              case 'implicit':
                // TODO: Set up OAuth 2.0 Implicit flow
                console.log('⚠️ OAuth 2.0 Implicit Flow')
                break
              case 'password':
                // TODO: Set up OAuth 2.0 Password flow
                console.log('⚠️ OAuth 2.0 Password Flow')
                break
              case 'clientCredentials':
                // TODO: Set up OAuth 2.0 Client Credentials flow
                console.log('⚠️ OAuth 2.0 Client Credentials Flow')
                break
              case 'authorizationCode':
                // eslint-disable-next-line no-case-declarations
                const authorizeRoute =
                  scheme?.flows?.authorizationCode?.authorizationUrl ??
                  '/oauth/authorize'

                console.log('✅ OAuth 2.0 Authorization Code Flow')
                console.log(
                  '   GET',
                  `${authorizeRoute}?redirect_uri=https://YOUR_REDIRECT_URI_HERE`,
                )
                console.log()

                if (
                  !app.routes.find(
                    (route) =>
                      route.path === authorizeRoute && route.method === 'GET',
                  )
                ) {
                  app.get(authorizeRoute, respondWithAuthorizePage)
                }

                break
              default:
                console.warn(`Unsupported OAuth 2.0 flow: ${flow}`)
            }
          })
        }
        break
      case 'openIdConnect':
        // TODO: Set up OpenID Connect authentication
        console.log('⚠️ OpenID Connect Authentication')
        break
      default:
        console.warn(`Unsupported security scheme type: ${scheme.type}`)
    }
  })

  console.log()

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

      if (requiresAuthentication) {
        console.log(`🔒 ${method.toUpperCase()} ${path}`)
      }

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
                        const cookies = c.req
                          .header('Cookie')
                          ?.split(';')
                          .reduce(
                            (acc, cookie) => {
                              const [key, value] = cookie.trim().split('=')
                              acc[key] = value
                              return acc
                            },
                            {} as Record<string, string>,
                          )

                        const apiKey = cookies?.[scheme.name]

                        if (apiKey) {
                          isAuthenticated = true
                        }
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
