import fs from 'node:fs/promises'

import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'

import { createMockServer } from '@scalar/mock-server'
import type { Context } from 'hono'

const port = process.env.PORT || 5052

/**
 * Load the specification from the workspace.
 * We do not want a circular depedency as galaxy uses mock server for its playground
 */
const specification = await fs.readFile('../galaxy/src/documents/3.1.yaml', 'utf8').catch(() => {
  console.error('[@scalar/mock-server] Missing @scalar/galaxy. Please build it and try again.')

  return ''
})

// Create the server instance
const app = await createMockServer({
  specification,
  onRequest: (opts: { context: Context }) => {
    console.log(`${opts.context.req.method} ${opts.context.req.url}`)
  },
})

// Render the API reference
app.get(
  '/',
  Scalar({
    pageTitle: 'Scalar Galaxy',
    sources: [
      {
        title: 'Scalar Galaxy',
        url: '/openapi.yaml',
      },
      {
        title: 'Petstore (OpenAPI 3.1)',
        url: 'https://petstore31.swagger.io/api/v31/openapi.json',
      },
    ],
    proxyUrl: 'https://proxy.scalar.com',
    baseServerURL: `http://localhost:${port}`,
  }),
)

// Start the server
serve(
  {
    fetch: app.fetch,
    port: Number(port),
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log()
    console.log(`🚧 Mock Server listening on http://localhost:${info.port}`)
    console.log()
  },
)
