import { createHtmlFromOpenApi, createMarkdownFromOpenApi } from '@/create-markdown-from-openapi'
import { serve } from '@hono/node-server'
import content from '@scalar/galaxy/latest.yaml?raw'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const html = await createHtmlFromOpenApi(content)

const markdown = await createMarkdownFromOpenApi(content)

const app = new Hono()
app.use(logger())

app.get('/', (c) =>
  c.html(
    `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <title>Scalar Galaxy</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
</head>
<body>
  <main class="container">
    ${html}
  </main>
</body>
</html>`,
  ),
)

app.get('/llms.txt', (c) => c.text(markdown))

const server = serve(app, (info) => {
  console.log()
  console.log(`🚧 Server listening on http://localhost:${info.port}`)
  console.log()
})

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    server.close()
  })
}
