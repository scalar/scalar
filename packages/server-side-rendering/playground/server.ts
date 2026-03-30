import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { getJsAsset, renderApiReference } from '../src'

const port = Number(process.env.PORT) || 5173

const app = new Hono()

// Serve the server-rendered API Reference
app.get('/', async (c) => {
  const html = await renderApiReference({
    config: {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    },
  })

  return c.html(html)
})

// Serve the standalone JS bundle for client-side hydration
app.get('/scalar/scalar.js', (c) => {
  return c.body(getJsAsset(), {
    headers: {
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
})

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`Server started at http://localhost:${port}`)
  },
)
