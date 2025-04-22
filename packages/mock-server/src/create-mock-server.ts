import { openapi } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'

import type { HttpMethod, MockServerOptions } from '@/types.ts'
import { getOperations } from '@/utils/get-operations.ts'
import { handleAuthentication } from '@/utils/handle-authentication.ts'
import { honoRouteFromPath } from '@/utils/hono-route-from-path.ts'
import { isAuthenticationRequired } from '@/utils/is-authentication-required.ts'
import { logAuthenticationInstructions } from '@/utils/log-authentication-instructions.ts'
import { setupAuthenticationRoutes } from '@/utils/setup-authentication-routes.ts'

import { mockAnyResponse } from './routes/mock-any-response.ts'
import { respondWithOpenApiDocument } from './routes/respond-with-open-api-document.ts'

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

  /** Authentication methods defined in the OpenAPI document */
  setupAuthenticationRoutes(app, schema)

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
      const operation = schema?.paths?.[path]?.[method] as OpenAPI.Operation

      // Check if authentication is required for this operation
      if (isAuthenticationRequired(operation.security)) {
        app[method](route, handleAuthentication(schema, operation))
      }

      // Actual route
      app[method](route, (c: Context) => mockAnyResponse(c, operation, options))
    })
  })

  // OpenAPI JSON file
  app.get('/openapi.json', (c) => respondWithOpenApiDocument(c, options?.specification, 'json'))

  // OpenAPI YAML file
  app.get('/openapi.yaml', (c) => respondWithOpenApiDocument(c, options?.specification, 'yaml'))

  return app
}
