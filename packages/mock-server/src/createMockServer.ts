import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import { type OpenAPI, openapi } from '@scalar/openapi-parser'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import {
  findPreferredResponseKey,
  isAuthenticationRequired,
  routeFromPath,
} from './utils'
import { anyBasicAuthentication } from './utils/anyBasicAuthentication'
import { anyOpenAuthPasswordGrantAuthentication } from './utils/anyOpenAuthPasswordGrantAuthentication'
import { getOpenAuthTokenUrl } from './utils/getOpenAuthTokenUrl'
import { isBasicAuthenticationRequired } from './utils/isBasicAuthenticationRequired'
import { isOpenAuthPasswordGrantRequired } from './utils/isOpenAuthPasswordGrantRequired'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: { context: Context; operation: OpenAPI.Operation }) => void
}) {
  const app = new Hono()

  // Resolve references
  const result = await openapi()
    .load(options?.specification ?? {})
    .dereference()
    .get()

  // CORS headers
  app.use(cors())

  // OpenAPI JSON file
  app.get('/openapi.json', async (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    const { specification } = await openapi().load(options.specification).get()

    return c.json(specification)
  })

  // OpenAPI YAML file
  app.get('/openapi.yaml', async (c) => {
    if (!options?.specification) {
      return c.text('Not found', 404)
    }

    const specification = await openapi().load(options.specification).toYaml()

    return c.text(specification)
  })

  // OpenAuth2 token endpoint
  const tokenUrl = getOpenAuthTokenUrl(result?.schema)

  if (typeof tokenUrl === 'string') {
    app.post(tokenUrl, async (c) => {
      return c.json(
        {
          access_token: 'super-secret-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'secret-refresh-token',
        },
        200,
        /**
         * When responding with an access token, the server must also include the additional Cache-Control: no-store
         * HTTP header to ensure clients do not cache this request.
         * @see https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
         */
        {
          'Cache-Control': 'no-store',
        },
      )
    })
  }

  // Paths
  Object.keys(result.schema?.paths ?? {}).forEach((path) => {
    // Operations
    Object.keys(result.schema?.paths?.[path] ?? {}).forEach((method) => {
      const route = routeFromPath(path)

      // @ts-expect-error Needs a proper type
      const operation = result.schema?.paths?.[path]?.[method]

      // Check if authentication is required
      const requiresAuthentication = isAuthenticationRequired(
        operation.security,
      )

      // Check whether we need basic authentication
      const requiresBasicAuthentication = isBasicAuthenticationRequired(
        operation,
        result?.schema,
      )

      // Add HTTP basic authentication
      if (requiresAuthentication && requiresBasicAuthentication) {
        // @ts-expect-error Needs a proper type
        app[method](route, anyBasicAuthentication())
      }

      // Check whether we need OpenAuth password grant authentication
      const requiresOpenAuthPasswordGrant = isOpenAuthPasswordGrantRequired(
        operation,
        result?.schema,
      )

      // Add HTTP basic authentication
      if (requiresAuthentication && requiresOpenAuthPasswordGrant) {
        // @ts-expect-error Needs a proper type
        app[method](route, anyOpenAuthPasswordGrantAuthentication())
      }

      // Route
      // @ts-expect-error Needs a proper type
      app[method](route, (c: Context) => {
        // Call onRequest callback
        if (options?.onRequest) {
          options.onRequest({
            context: c,
            operation,
          })
        }

        // Response
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
