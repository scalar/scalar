import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'

export interface ServerConfig {
  document: string
  port: number
  hostname?: string
}

export async function startMockServer(config: ServerConfig): Promise<void> {
  const { document, port, hostname = '0.0.0.0' } = config

  console.log()
  console.log('Starting mock server...')
  console.log()

  const app = await createMockServer({
    document,
    onRequest({ context }) {
      console.log(context.req.method, context.req.path)
    },
  })

  // Serve the OpenAPI document at /openapi.yaml for the API Reference
  app.get('/openapi.yaml', (c) => {
    return c.text(document)
  })

  // API Reference at root path
  app.get('/', Scalar({ url: '/openapi.yaml', theme: 'default' }))

  serve(
    {
      fetch: app.fetch,
      port,
      hostname,
    },
    (info) => {
      console.log(`🚀 Mock Server listening on http://${hostname}:${info.port}`)
      console.log(`📖 API Reference: http://${hostname}:${info.port}/`)
    },
  )
}
