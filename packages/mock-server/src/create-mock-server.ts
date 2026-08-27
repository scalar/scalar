import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { H } from 'hono/types'

import type { HttpMethod, MockServerOptions } from '@/types'
import { buildSeedContext } from '@/utils/build-seed-context'
import { executeSeed } from '@/utils/execute-seed'
import { getOperations } from '@/utils/get-operation'
import { handleAuthentication } from '@/utils/handle-authentication'
import { type PathKeyQueryParameter, parsePathKey } from '@/utils/hono-route-from-path'
import { isAuthenticationRequired } from '@/utils/is-authentication-required'
import { logAuthenticationInstructions } from '@/utils/log-authentication-instructions'
import { processOpenApiDocument } from '@/utils/process-openapi-document'
import { onlyWhenPathKeyAnswers } from '@/utils/select-path-key'
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

  /** One operation, with everything needed to register it on a Hono route */
  type RegisteredOperation = {
    /** Hono route the operation answers on */
    route: string
    /** HTTP method the operation answers */
    method: HttpMethod
    /** Route and method the operation shares with the path keys it competes against */
    group: string
    /** Position of the operation's path key among the ones sharing that group */
    position: number
    /** The operation itself */
    operation: OpenAPIV3_1.OperationObject
    /** Parameters shared by every operation of the path item */
    pathItemParameters: OpenAPIV3_1.PathItemObject['parameters']
  }

  /** Build every handler of one operation, in the order they run. */
  const buildHandlers = ({ operation, pathItemParameters }: RegisteredOperation): H[] => {
    const handlers: H[] = []

    // Operation-level security overrides the global requirement, so fall back to the
    // document-wide `security` when the operation does not define its own.
    const effectiveSecurity = operation.security ?? schema?.security

    // Check if authentication is required for this operation
    if (isAuthenticationRequired(effectiveSecurity)) {
      handlers.push(handleAuthentication(schema, operation))
    }

    // Notify the `onRequest` callback before validation runs, so it fires for every request —
    // including ones the validation middleware rejects with a `422`.
    if (configuration.onRequest) {
      handlers.push(async (c, next) => {
        configuration.onRequest?.({ context: c, operation })
        await next()
      })
    }

    // Validate the incoming request against the operation contract (on by default;
    // opt out with `validateRequest: false`). Runs after authentication but before the
    // mock handler. Validators are compiled once here, so there is no per-request recompilation.
    if (configuration.validateRequest !== false) {
      handlers.push(validateRequest(operation, pathItemParameters))
    }

    // Check if operation has x-handler extension
    // Validate that it's a non-empty string (consistent with x-seed validation)
    const handlerCode = operation?.['x-handler']
    const hasHandler = handlerCode && typeof handlerCode === 'string' && handlerCode.trim().length > 0

    // Route to appropriate handler
    handlers.push(hasHandler ? (c) => mockHandlerResponse(c, operation) : (c) => mockAnyResponse(c, operation))

    return handlers
  }

  /**
   * Query parameters of the path keys sharing a route and method, in document order.
   *
   * A path key that carries a query string (`/v1/messages?beta=true`) shares its route with the key
   * it is a variant of, so every operation on that route needs to know about the others to tell
   * which of them answers a given request.
   */
  const queriesByGroup = new Map<string, PathKeyQueryParameter[][]>()

  /** Every operation of the document, in the order its path key was declared */
  const operations: RegisteredOperation[] = []

  Object.keys(paths).forEach((path) => {
    // A path item may itself be a `$ref`, so resolve it before reading its operations.
    const pathItem = getResolvedRef(paths[path])
    const { route, query } = parsePathKey(path)
    const methods = Object.keys(getOperations(pathItem)) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const group = `${method} ${route}`
      const keys = queriesByGroup.get(group) ?? []

      operations.push({
        route,
        method,
        group,
        position: keys.length,
        operation: pathItem?.[method] as OpenAPIV3_1.OperationObject,
        pathItemParameters: pathItem?.parameters,
      })

      keys.push(query)
      queriesByGroup.set(group, keys)
    })
  })

  // Registering in document order keeps precedence between overlapping routes — whether `/pets/mine`
  // or `/pets/{id}` answers `GET /pets/mine` — exactly where the document put it. Which path key of a
  // route answers is decided per request instead, by `selectPathKey`.
  operations.forEach((registered) => {
    const keys = queriesByGroup.get(registered.group) ?? []

    buildHandlers(registered).forEach((handler) =>
      app[registered.method](registered.route, onlyWhenPathKeyAnswers(keys, registered.position, handler)),
    )
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
