import { serve } from '@hono/node-server'

import { createVoidServer } from '../src/createVoidServer'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 5052

// Create the server instance
const app = await createVoidServer()

// Start the server
serve(
  {
    fetch: app.fetch,
    hostname: host,
    port: Number(port),
  },
  (info) => {
    console.log()
    console.log(`🔁 Void Server listening on http://${host}:${info.port}`)
    console.log()
  },
)
