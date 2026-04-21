import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { StatusCode } from 'hono/utils/http-status'
import { stringify } from 'yaml'

import { errors } from '@/utils/constants'
import { createHtmlResponse } from '@/utils/create-html-response'
import { createJsonResponse } from '@/utils/create-json-response'
import { createStreamResponse } from '@/utils/create-stream-response'
import { createXmlResponse } from '@/utils/create-xml-response'
import { createZipFileResponse } from '@/utils/create-zip-file-response'
import { getRequestData } from '@/utils/get-request-data'

const mirrorResponseSchema = z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string(), z.string()),
  authentication: z
    .union([
      z.object({
        type: z.literal('http.basic'),
        token: z.string(),
        value: z.string(),
      }),
      z.object({
        type: z.literal('http.bearer'),
        token: z.string(),
      }),
    ])
    .optional(),
  cookies: z.record(z.string(), z.string()),
  query: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  body: z.any(),
})

const openApiDocumentSchema = z.record(z.string(), z.any())
const mirrorResponseExample = {
  method: 'GET',
  path: '/example',
  headers: {
    accept: 'application/json',
  },
  cookies: {},
  query: {},
  body: '',
}

const documentationApp = new OpenAPIHono()

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'Scalar API Reference',
    description: 'Interactive API reference for Void Server.',
    tags: ['Documentation'],
    responses: {
      200: {
        description: 'HTML API Reference page.',
        content: {
          'text/html': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) =>
    c.html(
      '<!doctype html><html><head><title>Void Server API Reference</title></head><body>Void Server API Reference</body></html>',
    ),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/{status}',
    summary: 'Return HTTP status responses',
    description:
      'Returns standard HTTP error messages for `4xx` and `5xx` status routes, and an empty body for `/204`.',
    tags: ['Void'],
    request: {
      params: z.object({
        status: z.string().openapi({
          examples: ['404', '500', '204'],
        }),
      }),
    },
    responses: {
      200: {
        description: 'Status route response.',
        content: {
          'text/plain': {
            schema: z.string(),
          },
        },
      },
      204: {
        description: 'No content response.',
      },
      400: {
        description: 'HTTP error message as plain text.',
        content: {
          'text/plain': {
            schema: z.string(),
          },
        },
      },
      500: {
        description: 'HTTP error message as plain text.',
        content: {
          'text/plain': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) => c.text('Not Found'),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/{filename}.{extension}',
    summary: 'Mirror request data by file extension',
    description: 'Forces the response format based on extension: `.json`, `.xml`, `.html`, or `.zip`.',
    tags: ['Void'],
    request: {
      params: z.object({
        filename: z.string(),
        extension: z.enum(['json', 'xml', 'html', 'zip']),
      }),
    },
    responses: {
      200: {
        description: 'Request mirrored in extension-specific format.',
        content: {
          'application/json': {
            schema: mirrorResponseSchema,
          },
          'application/xml': {
            schema: z.string(),
          },
          'text/html': {
            schema: z.string(),
          },
          'application/zip': {
            schema: z.string().openapi({
              format: 'binary',
            }),
          },
        },
      },
    },
  }),
  (c) => c.json(mirrorResponseExample),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/{path}',
    summary: 'Mirror dynamic paths',
    description: 'Mirrors request data for dynamic paths.',
    tags: ['Void'],
    request: {
      params: z.object({
        path: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Request mirrored in the negotiated content type.',
        content: {
          'application/json': {
            schema: mirrorResponseSchema,
          },
          'application/xml': {
            schema: z.string(),
          },
          'text/html': {
            schema: z.string(),
          },
          'application/zip': {
            schema: z.string().openapi({
              format: 'binary',
            }),
          },
        },
      },
      204: {
        description: 'No content response.',
      },
      400: {
        description: 'HTTP error message as plain text.',
        content: {
          'text/plain': {
            schema: z.string(),
          },
        },
      },
      500: {
        description: 'HTTP error message as plain text.',
        content: {
          'text/plain': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) => c.json(mirrorResponseExample),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/stream',
    summary: 'Stream Server-Sent Events',
    description: 'Streams `data: ping` events continuously.',
    tags: ['Void'],
    responses: {
      200: {
        description: 'SSE stream.',
        content: {
          'text/event-stream': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) => c.text('data: ping\n'),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/openapi.json',
    summary: 'Void Server OpenAPI document (JSON)',
    tags: ['Documentation'],
    responses: {
      200: {
        description: 'OpenAPI document in JSON format.',
        content: {
          'application/json': {
            schema: openApiDocumentSchema,
          },
        },
      },
    },
  }),
  (c) => c.json(getOpenApiDocument()),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/openapi.yaml',
    summary: 'Void Server OpenAPI document (YAML)',
    tags: ['Documentation'],
    responses: {
      200: {
        description: 'OpenAPI document in YAML format.',
        content: {
          'application/yaml': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) => c.text(stringify(getOpenApiDocument())),
)

documentationApp.openapi(
  createRoute({
    method: 'get',
    path: '/docs',
    summary: 'Scalar API Reference alias',
    description: 'Alias route for the interactive API reference.',
    tags: ['Documentation'],
    responses: {
      200: {
        description: 'HTML API Reference page.',
        content: {
          'text/html': {
            schema: z.string(),
          },
        },
      },
    },
  }),
  (c) =>
    c.html(
      '<!doctype html><html><head><title>Void Server API Reference</title></head><body>Void Server API Reference</body></html>',
    ),
)

const getOpenApiDocument = () =>
  documentationApp.getOpenAPI31Document({
    openapi: '3.1.0',
    info: {
      title: 'Scalar Void Server',
      version: '1.0.0',
      description: 'Mirror HTTP requests in multiple formats and inspect request data.',
    },
  })

/**
 * Create a void server instance
 */
export function createVoidServer() {
  const app = new OpenAPIHono()

  // Logger
  if (!process.env.CI) {
    app.use(logger())
  }

  // CORS headers
  app.use(cors())

  const scalarApiReference = Scalar({
    url: '/openapi.json',
    pageTitle: 'Void Server API Reference',
  })

  // Security headers
  app.use(async (c, next) => {
    await next()
    c.header('X-Content-Type-Options', 'nosniff')

    // The API reference needs scripts and styles from the CDN.
    if (c.req.path !== '/' && c.req.path !== '/docs') {
      c.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
    }
  })

  app.get('/openapi.json', (c) => c.json(getOpenApiDocument()))

  app.get('/openapi.yaml', (c) =>
    c.text(stringify(getOpenApiDocument()), 200, {
      'Content-Type': 'application/yaml; charset=UTF-8',
    }),
  )

  app.get('/', scalarApiReference)
  app.get('/docs', scalarApiReference)

  // HTTP errors
  app.all('/:status{[4-5][0-9][0-9]}', (c) => {
    const { status: originalStatusCode } = c.req.param()
    const status = Number.parseInt(originalStatusCode ?? '0', 10) as StatusCode

    c.status(status)

    return c.text(errors?.[status] ?? 'Unknown Error')
  })

  // No content
  app.all('/:status{204}', (c) => {
    return c.body(null, 204)
  })

  // Return content based on the file extension
  app.all('/:filename{.+\\.(html|xml|json|zip)$}', async (c) => {
    const requestData = await getRequestData(c)

    const { filename } = c.req.param()

    if (filename?.endsWith('.html')) {
      return createHtmlResponse(c, requestData)
    }
    if (filename?.endsWith('.xml')) {
      return createXmlResponse(c, requestData)
    }
    if (filename?.endsWith('.zip')) {
      return createZipFileResponse(c)
    }

    return createJsonResponse(c, requestData)
  })

  app.get('/stream', (c) => createStreamResponse(c))

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c) => {
    const requestData = await getRequestData(c)

    const acceptedContentType = accepts(c, {
      header: 'Accept',
      supports: ['text/html', 'application/xml', 'application/zip'],
      default: 'application/json',
    })

    if (acceptedContentType === 'text/html') {
      return createHtmlResponse(c, requestData)
    }
    if (acceptedContentType === 'application/xml') {
      return createXmlResponse(c, requestData)
    }
    if (acceptedContentType === 'application/zip') {
      return createZipFileResponse(c)
    }

    return createJsonResponse(c, requestData)
  })

  return app
}
