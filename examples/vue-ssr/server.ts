import { serve } from '@hono/node-server'
import { getJsAsset, renderApiReference } from '@scalar/server-side-rendering'
import { Hono } from 'hono'

const port = Number(process.env.PORT) || 5173

const app = new Hono()

// Serve the standalone JS bundle for client-side hydration
app.get('/scalar/scalar.js', (c) => {
  return c.body(getJsAsset(), {
    headers: {
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
})

// Serve the server-rendered API Reference
app.get('/scalar', async (c) => {
  const html = await renderApiReference({
    config: {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    },
  })

  return c.html(html)
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
