import { serve } from '@hono/node-server'
import fs from 'fs/promises'

import { createMockServer } from '../src/createMockServer'

const port = process.env.PORT || 5052

/**
 * Load the specification from the workspace.
 * We do not want a circular depedency as galaxy uses mock server for its playground
 */
const specification = await fs
  .readFile('../galaxy/dist/latest.json')
  .catch((err) => {
    console.error(err)
    console.error(
      'MISSING GALAXY SPEC FOR PLAYGROUND. PLEASE BUILD @scalar/galaxy',
    )
    return ''
  })

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
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log()
    console.log(`🚧 Mock Server listening on http://0.0.0.0:${info.port}`)
    console.log()
  },
)
