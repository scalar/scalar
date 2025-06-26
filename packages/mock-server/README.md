# Scalar Mock Server

[![Version](https://img.shields.io/npm/v/%40scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A powerful Node.js mock server that automatically generates realistic API responses from your OpenAPI/Swagger documents. It creates fully-functional endpoints with mock data, handles authentication, and respects content types - making it perfect for frontend development, API prototyping, and integration testing.

![](https://raw.githubusercontent.com/scalar/scalar/main/packages/cli/screenshots/mock.png)

## Features

- Perfect for frontend development and testing
- Creates endpoints automatically from OpenAPI documents
- Generates realistic mock data based on your schemas
- Handles authentication and responds with defined HTTP headers
- Supports Swagger 2.0 and OpenAPI 3.x documents
- Customizable response handling

## Quickstart

The easiest way to get started is through [our Scalar CLI](https://www.npmjs.com/package/@scalar/cli).
You can have a mock server up and running in seconds:

```bash
npx @scalar/cli document mock openapi.json --watch
```

## Installation

For advanced use cases, you can integrate the mock server directly into your Node.js application for full control:

```bash
npm install @scalar/mock-server
```

## Usage

```ts
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

// Your OpenAPI document
const specification = {
  openapi: '3.1.1',
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
  // Custom logging
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

### Authentication

You can define security schemes in your OpenAPI document and the mock server will validate the authentication:

```ts
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

// Your OpenAPI document
const specification = {
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/secret': {
      get: {
        security: [
          {
            bearerAuth: [],
          },
          {
            apiKey: [],
          },
        ],
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
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                example: {
                  error: 'Unauthorized',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
}

// Create the mocked routes
const app = await createMockServer({
  specification,
  // Custom logging
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

### OpenAPI endpoints

The given OpenAPI document is automatically exposed:

- `/openapi.json` and `/openapi.yaml`

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
