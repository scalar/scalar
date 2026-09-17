import { readFile } from 'node:fs/promises'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { createMarkdownFromOpenApi } from '../src/index'

const content = await readFile(new URL(import.meta.resolve('@scalar/galaxy/latest.yaml')), 'utf8')
const markdown = await createMarkdownFromOpenApi(content)

const app = new Hono()
app.use(logger())

app.get('/', (c) => c.text(markdown))

app.get('/llms.txt', (c) => c.text(markdown))

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
  console.log()
  console.log(`🚧 Server listening on http://localhost:${info.port}`)
  console.log()
})
