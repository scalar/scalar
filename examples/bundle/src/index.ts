import { serve } from '@hono/node-server'
import server from './server'

/**
 * Start the Hono server and listen on the configured port.
 * This is the entry point for the bundle example server.
 */
const { port, fetch } = server

console.log(`Server running on http://localhost:${port}`)

serve({
  fetch,
  port,
})
