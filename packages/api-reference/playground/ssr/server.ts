import fs from 'node:fs/promises'
import { serve } from '@hono/node-server'
import { type Context, Hono } from 'hono'
import type { ViteDevServer } from 'vite'

// Types
type RenderedOutput = {
  head?: string
  html?: string
}

type ServerRender = (url: string) => Promise<RenderedOutput>

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT) || 5173
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : ''

const app = new Hono()

// Add Vite or respective production middlewares
let vite: ViteDevServer | undefined

if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })

  // Fixed middleware handling
  app.use('*', async (c: Context, next) => {
    try {
      // Create a middleware promise that resolves when Vite is done
      await new Promise((resolve) => {
        vite?.middlewares(c.env.incoming, c.env.outgoing, resolve)
      })

      // If the response has already been handled by Vite, return
      if (c.env.outgoing.writableEnded) {
        return c.body(null)
      }

      // If Vite didn't handle the request, continue to next middleware
      return next()
    } catch (error) {
      console.error('Vite middleware error:', error)
      return next()
    }
  })
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default

  // Adapt compression middleware for Hono
  app.use('*', async (c: Context, next) => {
    await compression()(c.env.incoming, c.env.outgoing, () => {})
    await next()
  })

  // Serve static files using Hono's built-in static file serving
  app.use(base, async (c: Context, next) => {
    const handler = sirv('./dist/client', { extensions: [] })
    await handler(c.env.incoming, c.env.outgoing, () => {})
    await next()
  })
}

// Main route handler
app.get('*', async (c: Context) => {
  try {
    const url = c.req.path.replace(base, '')

    let template: string
    let render: ServerRender

    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8')
      template = (await vite?.transformIndexHtml(url, template)) ?? ''
      render =
        (await vite?.ssrLoadModule('/src/entry-server.ts'))?.render ?? (() => Promise.resolve({ head: '', html: '' }))
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const rendered = await render(url)

    const html = template
      .replace('<!--app-head-->', rendered.head ?? '')
      .replace('<!--app-html-->', rendered.html ?? '')

    return c.html(html)
  } catch (e: unknown) {
    if (vite) {
      vite.ssrFixStacktrace(e as Error)
    }
    console.log((e as Error).stack)
    return c.text((e as Error).stack ?? 'Internal Server Error', 500)
  }
})

// Start the server
serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`Server started at http://localhost:${port}`)
  },
)
