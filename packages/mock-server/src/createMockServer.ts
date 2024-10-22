import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import { openapi } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'
// @ts-expect-error Doesn’t come with types
import objectToXML from 'object-to-xml'

import type { HttpMethod } from './types'
import { anyBasicAuthentication } from './utils/anyBasicAuthentication'
import { anyOpenAuthCodeFlowAuthentication } from './utils/anyOpenAuthCodeFlowAuthentication'
import { anyOpenAuthPasswordGrantAuthentication } from './utils/anyOpenAuthPasswordGrantAuthentication'
import { findPreferredResponseKey } from './utils/findPreferredResponseKey'
import { getOpenAuthTokenUrl } from './utils/getOpenAuthTokenUrl'
import { getOperations } from './utils/getOperations'
import { honoRouteFromPath } from './utils/honoRouteFromPath'
import { isAuthenticationRequired } from './utils/isAuthenticationRequired'
import { isBasicAuthenticationRequired } from './utils/isBasicAuthenticationRequired'
import { isOpenAuthCodeFlowRequired } from './utils/isOpenAuthCodeFlowRequired'
import { isOpenAuthPasswordGrantRequired } from './utils/isOpenAuthPasswordGrantRequired'

/**
 * Create a mock server instance
 */
export async function createMockServer(options?: {
  specification: string | Record<string, any>
  onRequest?: (data: { context: Context; operation: OpenAPI.Operation }) => void
}) {
  const app = new Hono()

  /** Dereferenced OpenAPI document */
  const { schema } = await openapi()
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
  const tokenUrl = getOpenAuthTokenUrl(schema)

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

    // Add authorization endpoint for OAuth 2.0 Authorization Code flow
    app.get('/oauth/authorize', async (c) => {
      const redirectUri = c.req.query('redirect_uri')
      const state = c.req.query('state')
      const code = 'super-secret-token'

      if (!redirectUri) {
        return c.text('Missing redirect_uri', 400)
      }

      const redirectUrl = new URL(redirectUri)
      redirectUrl.searchParams.set('code', code)
      if (state) {
        redirectUrl.searchParams.set('state', state)
      }

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth 2.0 Authorization</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>OAuth 2.0 Authorization</h1>
        <p>Click the button below to authorize the application:</p>
        <a href="${redirectUrl.toString()}" class="button">Authorize</a>
    </div>
</body>
</html>
      `
      return c.html(htmlContent)
    })
  }

  /** Paths specified in the OpenAPI document */
  const paths = schema?.paths ?? {}

  Object.keys(paths).forEach((path) => {
    const methods = Object.keys(getOperations(paths[path])) as HttpMethod[]

    /** Keys for all operations of a specified path */
    methods.forEach((method) => {
      const route = honoRouteFromPath(path)

      const operation = schema?.paths?.[path]?.[method] as OpenAPI.Operation

      // Check if authentication is required
      const requiresAuthentication = isAuthenticationRequired(
        operation.security,
      )

      // Check whether we need basic authentication
      const requiresBasicAuthentication = isBasicAuthenticationRequired(
        operation,
        schema,
      )
      // Add HTTP basic authentication
      if (requiresAuthentication && requiresBasicAuthentication) {
        app[method](route, anyBasicAuthentication())
      }
      // Check whether we need OpenAuth password grant authentication
      const requiresOpenAuthPasswordGrant = isOpenAuthPasswordGrantRequired(
        operation,
        schema,
      )

      // Add HTTP basic authentication
      if (requiresAuthentication && requiresOpenAuthPasswordGrant) {
        app[method](route, anyOpenAuthPasswordGrantAuthentication())
      }

      // Check whether we need OAuth 2.0 Authorization Code flow authentication
      const requiresOpenAuthCodeFlow = isOpenAuthCodeFlowRequired(
        operation,
        schema,
      )

      // Add OAuth 2.0 Authorization Code flow authentication
      if (requiresAuthentication && requiresOpenAuthCodeFlow) {
        app[method](route, anyOpenAuthCodeFlowAuthentication())
      }

      // Route
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

        const preferredResponse = preferredResponseKey
          ? operation.responses?.[preferredResponseKey]
          : null

        const supportedContentTypes = Object.keys(
          preferredResponse?.content ?? {},
        )

        // Headers
        const headers = preferredResponse?.headers ?? {}

        Object.keys(headers).forEach((header) => {
          c.header(
            header,
            headers[header].schema
              ? getExampleFromSchema(headers[header].schema)
              : null,
          )
        })

        // Content-Type
        const acceptedContentType = accepts(c, {
          header: 'Accept',
          supports: supportedContentTypes,
          default: supportedContentTypes.includes('application/json')
            ? 'application/json'
            : supportedContentTypes[0],
        })

        c.header('Content-Type', acceptedContentType)

        const acceptedResponse =
          preferredResponse?.content?.[acceptedContentType]

        // Body
        const body = acceptedResponse?.example
          ? acceptedResponse.example
          : acceptedResponse?.schema
            ? getExampleFromSchema(acceptedResponse.schema, {
                emptyString: '…',
                variables: c.req.param(),
              })
            : null

        // Status code
        const statusCode = parseInt(
          preferredResponseKey === 'default'
            ? '200'
            : (preferredResponseKey ?? '200'),
          10,
        ) as StatusCode

        c.status(statusCode)

        return c.body(
          typeof body === 'object'
            ? // XML
              acceptedContentType?.includes('xml')
              ? `<?xml version="1.0" encoding="UTF-8"?>${objectToXML(body)}`
              : // JSON
                JSON.stringify(body, null, 2)
            : // String
              body,
        )
      })
    })
  })

  return app
}
