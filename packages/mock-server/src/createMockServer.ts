import { getExampleFromSchema } from '@scalar/oas-utils'
import {
  type OpenAPIV3_1,
  type ResolvedOpenAPI,
  openapi,
} from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import {
  authenticationRequired,
  findPreferredResponseKey,
  routeFromPath,
} from './utils'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: {
    context: Context
    operation: ResolvedOpenAPI.Operation
  }) => void
}) {
  const app = new Hono()

  // Resolve references
  const result = await openapi()
    .load(options?.specification ?? {})
    .resolve()

  // CORS headers
  app.use(cors())

  // OpenAPI JSON file
  app.get('/openapi.json', (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    return c.json(openapi().load(options.specification).get())
  })

  // OpenAPI YAML file
  app.get('/openapi.yaml', (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    return c.text(openapi().load(options.specification).toYaml())
  })

  // Paths
  Object.keys(result.schema?.paths ?? {}).forEach((path) => {
    // Request methods
    Object.keys(result.schema?.paths?.[path] ?? {}).forEach((method) => {
      const route = routeFromPath(path)

      // @ts-expect-error Needs a proper type
      const operation = result.schema?.paths?.[path]?.[method]

      // Check if authentication is required
      const requiresAuthentication = authenticationRequired(operation.security)
      // Get all available authentication methods
      const allowedSecuritySchemes = operation.security?.map(
        (securityScheme: OpenAPIV3_1.SecurityRequirementObject) => {
          return Object.keys(securityScheme)[0]
        },
      )
      // Check if one of them is HTTP Basic Auth
      const httpBasicAuthIsRequired =
        allowedSecuritySchemes?.findIndex((securitySchemeKey: string) => {
          const securityScheme =
            result?.schema?.components?.securitySchemes?.[securitySchemeKey]

          return (
            securityScheme?.type === 'http' &&
            securityScheme?.scheme === 'basic'
          )
        }) !== undefined

      // Add HTTP basic authentication
      if (requiresAuthentication && httpBasicAuthIsRequired) {
        // @ts-expect-error Needs a proper type
        app[method](
          route,
          basicAuth({
            username: 'demo',
            password: 'secret',
          }),
        )
      }

      // Route
      // @ts-expect-error Needs a proper type
      app[method](route, (c: Context) => {
        // Call onRequest callback
        if (options?.onRequest) {
          options.onRequest({
            context: c,
            operation,
          })
        }

        // Response
        // default, 200, 201 …
        const preferredResponseKey = findPreferredResponseKey(
          Object.keys(operation.responses ?? {}),
        )

        // Focus on JSON for now
        const jsonResponse = preferredResponseKey
          ? operation.responses?.[preferredResponseKey]?.content?.[
              'application/json'
            ]
          : null

        // Get or generate JSON
        const response = jsonResponse?.example
          ? jsonResponse.example
          : jsonResponse?.schema
            ? getExampleFromSchema(jsonResponse.schema, {
                emptyString: '…',
                variables: c.req.param(),
              })
            : null

        // Status code
        const statusCode = parseInt(
          preferredResponseKey === 'default'
            ? '200'
            : preferredResponseKey ?? '200',
          10,
        ) as StatusCode

        return c.json(response, statusCode)
      })
    })
  })

  return app
}
