import { serve } from '@hono/node-server'

import { createVoidServer } from '../src/create-void-server'
import { attachVoidWebSocket } from '../src/void-websocket'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 8080

const app = createVoidServer()

const httpServer = serve(
  {
    fetch: app.fetch,
    hostname: host,
    port: Number(port),
  },
  (info) => {
    console.log()
    console.log(`🔁 Void Server listening on http://${host}:${info.port}`)
    console.log(`🔁 WebSocket echo at ws://${host}:${info.port}`)
    console.log()
  },
)

attachVoidWebSocket(httpServer)
