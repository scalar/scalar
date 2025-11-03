import { dereference } from '@scalar/openapi-parser'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { HttpMethod, MockServerOptions } from '@/types'
import { getOperations } from '@/utils/get-operation'
import { handleAuthentication } from '@/utils/handle-authentication'
import { honoRouteFromPath } from '@/utils/hono-route-from-path'
import { isAuthenticationRequired } from '@/utils/is-authentication-required'
import { logAuthenticationInstructions } from '@/utils/log-authentication-instructions'
import { setUpAuthenticationRoutes } from '@/utils/set-up-authentication-routes'

import { mockAnyResponse } from './routes/mock-any-response'
import { respondWithOpenApiDocument } from './routes/respond-with-openapi-document'

/**
 * Create a mock server instance
 */
export function createMockServer(options: MockServerOptions): Promise<Hono> {
  const app = new Hono()

  /** Dereferenced OpenAPI document */
  const { schema } = dereference(options?.document ?? options?.specification ?? {})

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
      const operation = schema?.paths?.[path]?.[method] as OpenAPI.Operation

      // Check if authentication is required for this operation
      if (isAuthenticationRequired(operation.security)) {
        app[method](route, handleAuthentication(schema, operation))
      }

      // Actual route
      app[method](route, (c) => mockAnyResponse(c, operation, options))
    })
  })

  // OpenAPI JSON file
  app.get('/openapi.json', (c) => respondWithOpenApiDocument(c, options?.specification, 'json'))

  // OpenAPI YAML file
  app.get('/openapi.yaml', (c) => respondWithOpenApiDocument(c, options?.specification, 'yaml'))

  /**
   * No async code, but returning a Promise to allow future async logic to be implemented
   * @see https://github.com/scalar/scalar/pull/7174#discussion_r2470046281
   */
  return Promise.resolve(app)
}
