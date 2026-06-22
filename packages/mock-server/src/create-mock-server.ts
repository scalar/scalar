import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
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
import { validateRequest } from '@/utils/validate-request'

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
      // Merge `$ref` siblings so an `x-seed` placed next to a `$ref` is preserved (OpenAPI 3.1 semantics)
      const seedCode = (getResolvedRef(schemaObject, mergeSiblingReferences) as any)?.['x-seed']

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
    // A path item may itself be a `$ref`, so resolve it before reading its operations.
    const pathItem = getResolvedRef(paths[path])
    const methods = Object.keys(getOperations(pathItem)) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const route = honoRouteFromPath(path)
      const operation = pathItem?.[method] as OpenAPIV3_1.OperationObject

      // Operation-level security overrides the global requirement, so fall back to the
      // document-wide `security` when the operation does not define its own.
      const effectiveSecurity = operation.security ?? schema?.security

      // Check if authentication is required for this operation
      if (isAuthenticationRequired(effectiveSecurity)) {
        app[method](route, handleAuthentication(schema, operation))
      }

      // Notify the `onRequest` callback before validation runs, so it fires for every request —
      // including ones the validation middleware rejects with a `422`.
      if (configuration.onRequest) {
        app[method](route, async (c, next) => {
          configuration.onRequest?.({ context: c, operation })
          await next()
        })
      }

      // Validate the incoming request against the operation contract (on by default;
      // opt out with `validateRequest: false`). Runs after authentication but before the
      // mock handler. Validators are compiled once here, so there is no per-request recompilation.
      if (configuration.validateRequest !== false) {
        app[method](route, validateRequest(operation, pathItem?.parameters))
      }

      // Check if operation has x-handler extension
      // Validate that it's a non-empty string (consistent with x-seed validation)
      const handlerCode = operation?.['x-handler']
      const hasHandler = handlerCode && typeof handlerCode === 'string' && handlerCode.trim().length > 0

      // Route to appropriate handler
      if (hasHandler) {
        app[method](route, (c) => mockHandlerResponse(c, operation))
      } else {
        app[method](route, (c) => mockAnyResponse(c, operation))
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
