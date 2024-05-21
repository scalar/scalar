import { getExampleFromSchema } from '@scalar/oas-utils'
import { type ResolvedOpenAPI, openapi } from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import { findPreferredResponseKey, routeFromPath } from './utils'

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

      // Route
      // @ts-expect-error Needs a proper type
      app[method](route, (c: Context) => {
        // Call onRequest callback
        if (options?.onRequest) {
          options.onRequest({
            context: c,
            // @ts-expect-error Needs a proper type
            operation: result.schema.paths[path][method],
          })
        }

        // Response
        // @ts-expect-error Needs a proper type
        const operation = result.schema?.paths?.[path]?.[method]

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
