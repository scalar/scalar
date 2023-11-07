import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('OK'))

serve(
  {
    fetch: app.fetch,
    port: 5055,
  },
  (address) => {
    console.log(`🔥 Hono listening on http://localhost:${address.port}`)
  },
)
