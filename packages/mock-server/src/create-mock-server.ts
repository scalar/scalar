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
import { onlyWhenQueryMatches } from '@/utils/only-when-query-matches'
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

  /** One operation, with everything needed to register it on a Hono route */
  type RegisteredOperation = {
    /** Hono route the operation answers on */
    route: string
    /** HTTP method the operation answers */
    method: HttpMethod
    /** Query parameters that pick this operation over another one sharing its route */
    query: PathKeyQueryParameter[]
    /** Position of the path key in the document, which decides precedence between routes */
    index: number
    /** The operation itself */
    operation: OpenAPIV3_1.OperationObject
    /** Parameters shared by every operation of the path item */
    pathItemParameters: OpenAPIV3_1.PathItemObject['parameters']
  }

  /**
   * Build every handler of one operation, in the order they run.
   *
   * Handlers are built once per operation and registered as they are: the fallback registration below
   * puts the same instances on the route a second time, and rebuilding them would compile the
   * operation's request validators twice.
   */
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
   * Register an operation's handlers on its route.
   *
   * The `query` argument gates the handlers, so a request that does not carry those parameters falls
   * through to the next operation registered on the same route.
   */
  const registerHandlers = (
    { route, method }: RegisteredOperation,
    handlers: H[],
    query: PathKeyQueryParameter[],
  ): void => {
    handlers.forEach((handler) => app[method](route, onlyWhenQueryMatches(query, handler)))
  }

  /**
   * Operations grouped by the route and method they answer on.
   *
   * A path key that carries a query string (`/v1/messages?beta=true`) shares its route with the key it
   * is a variant of, and only operations sharing a route compete for a request.
   */
  const operationsByRoute = new Map<string, RegisteredOperation[]>()

  Object.keys(paths).forEach((path, index) => {
    // A path item may itself be a `$ref`, so resolve it before reading its operations.
    const pathItem = getResolvedRef(paths[path])
    const { route, query } = parsePathKey(path)
    const methods = Object.keys(getOperations(pathItem)) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const group = operationsByRoute.get(`${method} ${route}`) ?? []

      group.push({
        route,
        method,
        query,
        index,
        operation: pathItem?.[method] as OpenAPIV3_1.OperationObject,
        pathItemParameters: pathItem?.parameters,
      })

      operationsByRoute.set(`${method} ${route}`, group)
    })
  })

  /** One registration of an operation's handlers, in the document slot it competes for */
  type Registration = {
    /** Document slot the handlers are registered in, which is what decides precedence */
    slot: number
    /** The operation the handlers belong to */
    operation: RegisteredOperation
    /** Query parameters the request has to carry, empty when the handlers answer unconditionally */
    query: PathKeyQueryParameter[]
    /** The operation's handlers, built once and shared with the fallback registration */
    handlers: H[]
  }

  const registrations: Registration[] = []

  operationsByRoute.forEach((group) => {
    // The most specific path key goes first, so `/v1/messages?beta=true` answers a request that
    // carries `beta=true` and `/v1/messages` answers the rest. The sort is stable, so path keys with
    // the same number of query parameters keep their document order.
    const operations = [...group].sort((a, b) => b.query.length - a.query.length)

    // Ordering by specificity may only shuffle the group's own path keys, never move the route as a
    // whole: which of `/pets/mine` and `/pets/{id}` answers `GET /pets/mine` follows from where each
    // was declared. Reusing the group's own document slots keeps that intact.
    const slots = group.map(({ index }) => index).sort((a, b) => a - b)

    const built = operations.map((operation, position) => ({
      slot: slots[position] ?? operation.index,
      operation,
      query: operation.query,
      handlers: buildHandlers(operation),
    }))

    registrations.push(...built)

    // A query string in a path key tells two operations apart, it is not a parameter clients have to
    // send, and documents written this way often carry no plain key at all. The path key with the
    // fewest query parameters therefore answers a request that carries none, through a second
    // registration without the gate.
    const fallback = built.reduce((fewest, registration) =>
      registration.query.length < fewest.query.length ? registration : fewest,
    )

    if (fallback.query.length > 0) {
      // The group's last slot, so a path key that does require a query string still wins over the
      // fallback for a request that carries it.
      registrations.push({ ...fallback, slot: slots.at(-1) ?? fallback.slot, query: [] })
    }
  })

  // Hono answers with the first matching registration, so the document order of the path keys — with
  // each group's own keys ordered by specificity — is what resolves overlapping routes.
  registrations
    .sort((a, b) => a.slot - b.slot)
    .forEach(({ operation, handlers, query }) => registerHandlers(operation, handlers, query))

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
