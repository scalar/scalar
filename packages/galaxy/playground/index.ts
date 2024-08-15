import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'
import fs from 'node:fs'

// import specification from '../src/specification/3.1.yaml'

const specification = fs.readFileSync('../src/specifications/3.1.yaml', 'utf-8')
console.log(typeof specification)
const port = process.env.PORT || 5052

// Create the server instance
const app = await createMockServer({
  specification,
  onRequest: ({ context }) => {
    console.log(`${context.req.method} ${context.req.url}`)
  },
})

// Start the server
serve(
  {
    fetch: app.fetch,
    port: Number(port),
  },
  (info) => {
    console.log()
    console.log(`🚧 Mock Server listening on http://localhost:${info.port}`)
    console.log()
  },
)
