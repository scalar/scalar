import { type Operation, getExampleFromSchema } from '@scalar/oas-utils'
import { openapi } from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'

import { routeFromPath } from '../utils'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: { context: Context; operation: Operation }) => void
}) {
  const app = new Hono()

  // Resolve references
  const result = await openapi().load(options.specification).resolve()

  // OpenAPI file
  app.get('/openapi.json', (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    return c.json(options.specification)
  })

  // Paths
  Object.keys(result.schema.paths ?? {}).forEach((path) => {
    // Request methods
    Object.keys(result.schema.paths[path]).forEach((method) => {
      const route = routeFromPath(path)

      // Route
      app[method](route, (c: Context) => {
        // Call onRequest callback
        if (options?.onRequest) {
          options.onRequest({
            context: c,
            operation: result.schema.paths[path][method],
          })
        }

        // Response
        const operation = result.schema.paths[path][method]

        const jsonResponseConfiguration =
          operation.responses?.['200']?.content['application/json']

        const response = jsonResponseConfiguration?.example
          ? jsonResponseConfiguration.example
          : jsonResponseConfiguration?.schema
            ? getExampleFromSchema(jsonResponseConfiguration.schema, {
                emptyString: '…',
              })
            : null

        return c.json(response)
      })
    })
  })

  return app
}
