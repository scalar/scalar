import { serve } from '@hono/node-server'

import { createVoidServer } from '../src/create-void-server'
import { attachVoidWebSocketEcho, createVoidWebSocketServer } from '../src/utils/void-websocket'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 8080

// Create the server instance
const app = createVoidServer()
const webSocketServer = createVoidWebSocketServer()

// Start the server
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

attachVoidWebSocketEcho(httpServer, webSocketServer)
