# Scalar Mock Server

[![Version](https://img.shields.io/npm/v/%40scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A powerful Node.js server that generates and returns realistic mock data based on OpenAPI specifications. Ideal for API development, testing, and prototyping.

![](https://raw.githubusercontent.com/scalar/scalar/main/packages/cli/screenshots/mock.png)

## Features

- Automatically creates endpoints from your OpenAPI/Swagger document
- Generates realistic sample data matching your schema definitions
- Supports Swagger 2.0, OpenAPI 3.0 and 3.1 specifications
- Customizable response handling and data generation
- Perfect for frontend development without an actual backend

## Quickstart

It’s part of [our Scalar CLI](https://github.com/scalar/scalar/tree/main/packages/cli), you can boot it literllay in seconds:

```bash
npx @scalar/cli mock openapi.json --watch
```

## Installation

For more advanced use cases or finer control over the mock server, you can use the package directly in your Node.js application:

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

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
