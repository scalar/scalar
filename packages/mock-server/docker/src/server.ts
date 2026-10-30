import { serve, upgradeWebSocket } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import { WebSocketServer } from 'ws'

interface ServerConfig {
  document: string
  origin?: string
  format: 'json' | 'yaml'
  port?: number
  /** Reject requests that violate the API description with `422`. Defaults to the library's `true`. */
  validateRequest?: boolean
}

export async function startMockServer(config: ServerConfig): Promise<void> {
  const { document, format, port = 3000 } = config

  console.log()
  console.log('Starting mock server...')
  console.log()

  if (config.validateRequest === false) {
    // Say so up front: with validation off, a malformed request gets a mock response instead of a
    // `422`, which is easy to mistake for the request being correct.
    console.log(
      'Request validation is disabled: requests that violate the API description get a mock response, not a 422.',
    )
    console.log()
  }

  const app = await createMockServer({
    document,
    origin: config.origin,
    validateRequest: config.validateRequest,
    upgradeWebSocket,
    logger: (line) => console.log(line),
    onMessage: ({ channel, direction, payload }) =>
      console.log(`${direction === 'in' ? '→' : '←'} ${channel}`, payload),
    onRequest: ({ context }) => console.log(context.req.method, context.req.path),
  })
  const websocket = { server: new WebSocketServer({ noServer: true }) }

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

  serve(
    {
      fetch: app.fetch,
      port,
      websocket,
    },
    (info) => {
      console.log(`🚀 Mock Server listening on http://${info.address}:${info.port}`)
      console.log(`📖 API Reference: http://${info.address}:${info.port}/scalar`)
    },
  )
}
