import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { HttpMethod, MockServerOptions } from '@/types'
import { buildSeedContext } from '@/utils/build-seed-context'
import { executeSeed } from '@/utils/execute-seed'
import { getOperations } from '@/utils/get-operation'
import { handleAuthentication } from '@/utils/handle-authentication'
import { honoRouteFromPath } from '@/utils/hono-route-from-path'
import { isAuthenticationRequired } from '@/utils/is-authentication-required'
import { logAuthenticationInstructions } from '@/utils/log-authentication-instructions'
import { processOpenApiDocument } from '@/utils/process-openapi-document'
import { setUpAuthenticationRoutes } from '@/utils/set-up-authentication-routes'

import { store } from './libs/store'
import { mockAnyResponse } from './routes/mock-any-response'
import { mockHandlerResponse } from './routes/mock-handler-response'
import { respondWithOpenApiDocument } from './routes/respond-with-openapi-document'

/**
 * Create a mock server instance
 */
export async function createMockServer(configuration: MockServerOptions): Promise<Hono> {
  const app = new Hono()

  /** Dereferenced OpenAPI document */
  const schema = await processOpenApiDocument(configuration?.document ?? configuration?.specification)

  // Seed data from schemas with x-seed extension
  // This happens before routes are set up so data is available immediately
  const schemas = schema?.components?.schemas
  if (schemas) {
    for (const [schemaName, schemaObject] of Object.entries(schemas)) {
      const seedCode = (schemaObject as any)?.['x-seed']

      if (seedCode && typeof seedCode === 'string') {
        try {
          // Check if collection is empty (idempotent seeding)
          // Use the schema key directly as the collection name
          const existingItems = store.list(schemaName)
          if (existingItems.length === 0) {
            // Build seed context with schema key (used as collection name)
            const seedContext = buildSeedContext(schemaName)

            // Execute seed code
            await executeSeed(seedCode, seedContext)
          }
        } catch (error) {
          // Log error but don't fail server startup
          console.error(`Error seeding schema "${schemaName}":`, error)
        }
      }
    }
  }

  // CORS headers
  app.use(cors())

  /** Authentication methods defined in the OpenAPI document */
  setUpAuthenticationRoutes(app, schema)

  logAuthenticationInstructions(
    schema?.components?.securitySchemes || ({} as Record<string, OpenAPIV3_1.SecuritySchemeObject>),
  )

  /** Paths specified in the OpenAPI document */
  const paths = schema?.paths ?? {}

  Object.keys(paths).forEach((path) => {
    const methods = Object.keys(getOperations(paths[path])) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const route = honoRouteFromPath(path)
      const operation = schema?.paths?.[path]?.[method] as OpenAPIV3_1.OperationObject

      // Check if authentication is required for this operation
      if (isAuthenticationRequired(operation.security)) {
        app[method](route, handleAuthentication(schema, operation))
      }

      // Check if operation has x-handler extension
      // Validate that it's a non-empty string (consistent with x-seed validation)
      const handlerCode = operation?.['x-handler']
      const hasHandler = handlerCode && typeof handlerCode === 'string' && handlerCode.trim().length > 0

      // Route to appropriate handler
      if (hasHandler) {
        app[method](route, (c) => mockHandlerResponse(c, operation, configuration))
      } else {
        app[method](route, (c) => mockAnyResponse(c, operation, configuration))
      }
    })
  })

  // OpenAPI JSON file
  app.get('/openapi.json', (c) =>
    respondWithOpenApiDocument(c, configuration?.document ?? configuration?.specification, 'json'),
  )

  // OpenAPI YAML file
  app.get('/openapi.yaml', (c) =>
    respondWithOpenApiDocument(c, configuration?.document ?? configuration?.specification, 'yaml'),
  )

  return app
}
