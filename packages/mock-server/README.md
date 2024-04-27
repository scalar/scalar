# Scalar Mock Server

A server returning fake data based on an OpenAPI specification

## Installation

```bash
npm install @scalar/mock-server
```

## Usage

```ts
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

// Your OpenAPI specification
const specification = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/foobar': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                example: {
                  foo: 'bar',
                },
              },
            },
          },
        },
      },
    },
  },
}

// Create the mocked routes
const app = await createMockServer({
  specification,
  onRequest({ context, operation }) {
    console.log(context.req.method, context.req.path)
  },
})

// Start the server
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`)
  },
)
```
