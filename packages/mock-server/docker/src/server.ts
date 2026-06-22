import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { createAsyncApiMockServer, createMockServer, isAsyncApiDocument } from '@scalar/mock-server'
import type { Hono } from 'hono'

interface ServerConfig {
  document: string
  format: 'json' | 'yaml'
  port?: number
}

/** Parse the raw document just enough to tell whether it is an AsyncAPI definition. */
function parseDocument(document: string, format: 'json' | 'yaml'): unknown {
  if (format === 'json') {
    try {
      return JSON.parse(document)
    } catch {
      return undefined
    }
  }
  // For YAML, a cheap top-level check avoids pulling a parser just for detection.
  return /^asyncapi\s*:/m.test(document) ? { asyncapi: true } : undefined
}

export async function startMockServer(config: ServerConfig): Promise<void> {
  const { document, format, port = 3000 } = config

  console.log()
  console.log('Starting mock server...')
  console.log()

  const isAsyncApi = isAsyncApiDocument(parseDocument(document, format))

  let app: Hono
  // AsyncAPI WebSocket channels must be injected into the HTTP server after `serve()`.
  let injectWebSocket: ((server: ReturnType<typeof serve>) => void) | undefined

  if (isAsyncApi) {
    const mock = await createAsyncApiMockServer({
      document,
      logger: (line) => console.log(line),
      onMessage: ({ channel, direction, payload }) =>
        console.log(`${direction === 'in' ? '→' : '←'} ${channel}`, payload),
    })
    app = mock.app
    injectWebSocket = mock.injectWebSocket
  } else {
    app = await createMockServer({
      document,
      onRequest({ context }) {
        console.log(context.req.method, context.req.path)
      },
    })
  }

  // Determine endpoint and content type based on format
  const endpoint = format === 'json' ? '/openapi.json' : '/openapi.yaml'
  const contentType = format === 'json' ? 'application/json' : 'application/yaml; charset=UTF-8'

  // Serve the API document at the appropriate endpoint for the API Reference
  app.get(endpoint, (c) => {
    c.header('Content-Type', contentType)
    return c.text(document)
  })

  // API Reference at /scalar (renders both OpenAPI and AsyncAPI documents)
  app.get('/scalar', Scalar({ url: endpoint, theme: 'default' }))

  const server = serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`🚀 Mock Server listening on http://${info.address}:${info.port}`)
      console.log(`📖 API Reference: http://${info.address}:${info.port}/scalar`)
    },
  )

  // Attach WebSocket handling for AsyncAPI ws/wss channels.
  injectWebSocket?.(server)
}
