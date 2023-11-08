import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'

const app = new OpenAPIHono()

// Example route
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

// Create a Swagger file
app.doc('/swagger.json', {
  info: {
    title: 'Example',
    description:
      'The `@scalar/hono-api-reference` middleware renders a beautiful API reference based on your OpenAPI specification.',
    version: 'v1',
  },
  openapi: '3.1.0',
})

// Load the middleware
app.get(
  '/',
  apiReference({
    spec: {
      url: '/swagger.json',
    },
    pageTitle: 'Hono API Reference Demo',
  }),
)

// Listen
serve(
  {
    fetch: app.fetch,
    port: 5055,
  },
  (address) => {
    console.log(
      `🔥 Hono Middleware listening on http://localhost:${address.port}/`,
    )
  },
)
