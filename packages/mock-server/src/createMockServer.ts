import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import { type OpenAPI, openapi } from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import {
  findPreferredResponseKey,
  isAuthenticationRequired,
  routeFromPath,
} from './utils'
import { anyBasicAuthentication } from './utils/anyBasicAuthentication'
import { isBasicAuthenticationRequired } from './utils/isBasicAuthenticationRequired'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: { context: Context; operation: OpenAPI.Operation }) => void
}) {
  const app = new Hono()

  // Resolve references
  const result = await openapi()
    .load(options?.specification ?? {})
    .dereference()
    .get()

  // CORS headers
  app.use(cors())

  // OpenAPI JSON file
  app.get('/openapi.json', async (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    const { specification } = await openapi().load(options.specification).get()

    return c.json(specification)
  })

  // OpenAPI YAML file
  app.get('/openapi.yaml', async (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    const specification = await openapi().load(options.specification).toYaml()

    return c.text(specification)
  })

  // Paths
  Object.keys(result.schema?.paths ?? {}).forEach((path) => {
    // Operations
    Object.keys(result.schema?.paths?.[path] ?? {}).forEach((method) => {
      const route = routeFromPath(path)

      // @ts-expect-error Needs a proper type
      const operation = result.schema?.paths?.[path]?.[method]

      // Check if authentication is required
      const requiresAuthentication = isAuthenticationRequired(
        operation.security,
      )
      // Get all available authentication methods
      const requiresBasicAuthentication = isBasicAuthenticationRequired(
        operation,
        result?.schema,
      )

      // Add HTTP basic authentication
      if (requiresAuthentication && requiresBasicAuthentication) {
        // @ts-expect-error Needs a proper type
        app[method](route, anyBasicAuthentication())
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
