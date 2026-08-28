import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { type Context, Hono, type MiddlewareHandler } from 'hono'
import { every } from 'hono/combine'
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
import { requestMatchesPinnedQuery } from '@/utils/request-matches-pinned-query'
import { setUpAuthenticationRoutes } from '@/utils/set-up-authentication-routes'
import { splitPathKey } from '@/utils/split-path-key'
import { validateRequest } from '@/utils/validate-request'

import { store } from './libs/store'
import { mockAnyResponse } from './routes/mock-any-response'
import { mockHandlerResponse } from './routes/mock-handler-response'
import { respondWithOpenApiDocument } from './routes/respond-with-openapi-document'

/** The operation a route mocks, used to name what failed in an error response */
type MockedOperation = {
  /** Uppercased HTTP method, for example `GET` */
  method: Uppercase<HttpMethod>
  /** The OpenAPI path key, for example `/pets/{petId}` (not the Hono route it is registered as) */
  path: string
  /** The `operationId` of the operation, when the document declares one */
  operationId?: string
}

/**
 * Context variables the mock server sets on a request, so the error handler can read back which
 * operation was being mocked when something threw.
 *
 * The app itself stays a plain `Hono` because that type is part of this package's public API, so
 * the variable is reached through a narrowed view of the context instead.
 */
type MockServerContext = Context<{ Variables: { mockedOperation: MockedOperation } }>

/** Record which operation a request matched, so an error escaping it can be named */
const setMockedOperation = (c: Context, operation: MockedOperation): void => {
  ;(c as MockServerContext).set('mockedOperation', operation)
}

/** Read back the operation a request matched, or `undefined` when it reached no mocked route */
const getMockedOperation = (c: Context): MockedOperation | undefined => (c as MockServerContext).get('mockedOperation')

/**
 * Whether an error carries its own response, the way Hono's `HTTPException` does.
 *
 * Checked structurally rather than with `instanceof`, exactly like Hono's own default handler, so an
 * `HTTPException` thrown from a second copy of Hono is still recognized.
 */
const carriesResponse = (error: Error): error is Error & { getResponse: () => Response } =>
  'getResponse' in error && typeof error.getResponse === 'function'

/**
 * Create a mock server instance
 */
export async function createMockServer(configuration: MockServerOptions): Promise<Hono> {
  const app = new Hono()

  // Unhandled errors would otherwise reach Hono's default handler, which answers with a plain-text
  // `Internal Server Error` that says nothing about what broke. A mock server fails for mundane,
  // document-shaped reasons — a response header name the runtime rejects, an example that cannot be
  // serialized — so answer with JSON that names the failing operation and repeats the message,
  // which makes the failure readable in the response instead of something to go reproduce.
  app.onError((error, c) => {
    // The status and body such an error chose are deliberate, not an internal failure, so answer
    // with them. Unlike Hono's default handler, which returns the response directly, it is rebuilt
    // through the context so headers already staged on the response — those from the CORS
    // middleware, most of all — still apply.
    if (carriesResponse(error)) {
      const response = error.getResponse()
      return c.newResponse(response.body, response)
    }

    const operation = getMockedOperation(c)

    // Keep logging the error, as Hono's default handler does, so the stack trace is not lost. Routes
    // added to the returned app are not mocked operations, so name the concrete request instead —
    // the log always points somewhere.
    console.error(
      operation
        ? `Error while mocking ${operation.method} ${operation.path}:`
        : `Error handling ${c.req.method} ${c.req.path}:`,
      error,
    )

    return c.json(
      {
        error: 'Internal Server Error',
        message: error.message,
        // Left out entirely rather than sent as `null`, so a client can test for the key.
        ...(operation ? { operation } : {}),
      },
      500,
    )
  })

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

  // Handing `quiet` down instead of skipping the call keeps the warnings and errors about security
  // schemes the mock server cannot handle, which a quiet startup should still surface.
  logAuthenticationInstructions(
    schema?.components?.securitySchemes || ({} as Record<string, OpenAPIV3_1.SecuritySchemeObject>),
    { quiet: configuration?.quiet },
  )

  /** Paths specified in the OpenAPI document */
  const paths = schema?.paths ?? {}

  // A path key may pin query parameters to describe a variant of an operation, for example
  // `/v1/messages?beta=true` next to `/v1/messages`. Hono runs every matching route in registration
  // order, so a variant has to come before the sibling it shares a path with — otherwise the sibling
  // answers its requests too, and the more pinned parameters a key has the more specific it is.
  const pathKeys = Object.keys(paths).map((path) => {
    const { path: pathname, query } = splitPathKey(path)

    return { path, pathname, query }
  })

  /** Where each path first shows up in the document, so its variants stay with it */
  const documentOrder = new Map<string, number>()

  pathKeys.forEach(({ pathname }, index) => {
    if (!documentOrder.has(pathname)) {
      documentOrder.set(pathname, index)
    }
  })

  // Keys that share a path are grouped where the first of them appears and the most specific one
  // leads the group; a key with a path of its own never moves. So the only keys that change places
  // with anything unrelated are the variants of a path that is described more than once. When two
  // distinct paths overlap — a literal and a parameterized one that pins a query — neither is moved,
  // so whichever the document declares first is matched first, the same as any pair of overlapping
  // Hono routes.
  const orderedPathKeys = [...pathKeys].sort(
    (a, b) =>
      (documentOrder.get(a.pathname) ?? 0) - (documentOrder.get(b.pathname) ?? 0) || b.query.length - a.query.length,
  )

  orderedPathKeys.forEach(({ path, query }) => {
    // A path item may itself be a `$ref`, so resolve it before reading its operations.
    const pathItem = getResolvedRef(paths[path])
    const methods = Object.keys(getOperations(pathItem)) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const route = honoRouteFromPath(path)
      const operation = pathItem?.[method] as OpenAPIV3_1.OperationObject

      // Remember which operation this route mocks, so the error handler can name it when something
      // fails downstream. Recorded on the context rather than mapped back from the request path,
      // which would not survive the app being mounted under a base path. Registered before the rest
      // of the route so a failure in request validation is named too. The OpenAPI path key is kept
      // (rather than the Hono route) because that is what the document author reads.
      const mockedOperation: MockedOperation = {
        // `toUpperCase` widens to `string`, so restate the narrower type the method union guarantees.
        method: method.toUpperCase() as Uppercase<HttpMethod>,
        path,
        ...(operation?.operationId ? { operationId: operation.operationId } : {}),
      }

      /** Middleware chain answering this operation, in the order it runs */
      const handlers: MiddlewareHandler[] = []

      // Runs first, so the error handler can name the operation even when validation fails. For a
      // path key that pins a query it is part of the guarded chain below, so it only fires once the
      // request actually matches the variant rather than for one that is handed on to the sibling.
      handlers.push(async (c, next) => {
        setMockedOperation(c, mockedOperation)
        await next()
      })

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
        handlers.push(validateRequest(operation, pathItem?.parameters))
      }

      // Check if operation has x-handler extension
      // Validate that it's a non-empty string (consistent with x-seed validation)
      const handlerCode = operation?.['x-handler']
      const hasHandler = handlerCode && typeof handlerCode === 'string' && handlerCode.trim().length > 0

      // Route to appropriate handler
      if (hasHandler) {
        handlers.push(async (c) => await mockHandlerResponse(c, operation))
      } else {
        handlers.push(async (c) => await mockAnyResponse(c, operation))
      }

      if (query.length === 0) {
        handlers.forEach((handler) => app[method](route, handler))

        return
      }

      // The pinned query parameters are not part of the route, so they are checked here. A request
      // that does not carry them is handed on to the next matching route — usually the sibling path
      // key without the query string.
      const operationChain = every(...handlers)

      app[method](route, async (c, next) => {
        if (!requestMatchesPinnedQuery(c, query)) {
          await next()

          return
        }

        await operationChain(c, next)
      })
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
