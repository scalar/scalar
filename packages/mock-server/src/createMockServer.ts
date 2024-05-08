import { type Operation, getExampleFromSchema } from '@scalar/oas-utils'
import { openapi } from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'

import { routeFromPath } from './utils'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: { context: Context; operation: Operation }) => void
}) {
  const app = new Hono()

  // Resolve references
  const result = await openapi()
    .load(options?.specification ?? {})
    .resolve()

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
