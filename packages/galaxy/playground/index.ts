import { serve } from '@hono/node-server'
import { apiReference } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import fs from 'fs/promises'

const specification = await fs
  .readFile('./src/specifications/3.1.yaml', 'utf-8')
  .catch(() => {
    console.error('MISSING GALAXY SPEC FOR PLAYGROUND')
    return ''
  })

const port = process.env.PORT || 5052

// Create the server instance
const app = await createMockServer({
  specification,
  onRequest: ({ context }) => {
    console.log(`${context.req.method} ${context.req.url}`)
  },
})

// Load the middleware
app.get(
  '/',
  apiReference({
    spec: {
      content: specification,
    },
    pageTitle: 'Scalar Galaxy Spec',
  }),
)

// Start the server
serve(
  {
    fetch: app.fetch,
    port: Number(port),
  },
  (info: { port: number }) => {
    console.log()
    console.log(`🚧 Mock Server listening on http://localhost:${info.port}`)
    console.log()
  },
)
