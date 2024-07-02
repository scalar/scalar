import { serve } from '@hono/node-server'

import { createVoidServer } from '../src/createVoidServer'

const port = process.env.PORT || 5052

// Create the server instance
const app = await createVoidServer()

// Start the server
serve(
  {
    fetch: app.fetch,
    port: Number(port),
  },
  (info) => {
    console.log()
    console.log(`🔁 Void Server listening on http://localhost:${info.port}`)
    console.log()
  },
)
