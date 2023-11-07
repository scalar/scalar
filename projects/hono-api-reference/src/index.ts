import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const app = new OpenAPIHono()

app.get('/', (c) => c.text('OK'))

app.openapi(
  createRoute({
    method: 'get',
    path: '/hello',
    responses: {
      200: {
        description: 'Respond a message',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.jsonT({
      message: 'hello',
    })
  },
)

app.doc('/swagger.json', {
  info: {
    title: 'Example',
    version: 'v1',
  },
  openapi: '3.1.0',
})

serve(
  {
    fetch: app.fetch,
    port: 5055,
  },
  (address) => {
    console.log(`🔥 Hono listening on http://localhost:${address.port}`)
  },
)
