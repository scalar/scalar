import fs from 'node:fs/promises'
import express, { type Request, type Response } from 'express'
import type { ViteDevServer } from 'vite'

// Types
type RenderedOutput = {
  head?: string
  html?: string
}

type ServerRender = (url: string) => Promise<RenderedOutput>

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : ''

// Create http server
const app = express()

// Add Vite or respective production middlewares
let vite: ViteDevServer | undefined

if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use('*', async (req: Request, res: Response) => {
  try {
    const url = req.originalUrl.replace(base, '')

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

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e: unknown) {
    if (vite) {
      vite.ssrFixStacktrace(e as Error)
    }
    console.log((e as Error).stack)
    res.status(500).end((e as Error).stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
