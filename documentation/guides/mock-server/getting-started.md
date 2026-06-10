# Mock Server
<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/mock-server" aria-label="View @scalar/mock-server on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/mock-server"></a>
<a href="https://www.npmjs.com/@scalar/mock-server" aria-label="View NPM downloads for @scalar/mock-server"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/mock-server"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

A powerful Node.js mock server that automatically generates realistic API responses from your OpenAPI/Swagger documents. It creates fully-functional endpoints with mock data, handles authentication, and respects content types - making it perfect for frontend development, API prototyping, and integration testing.

## Features

- Perfect for frontend development and testing
- Creates endpoints automatically from OpenAPI documents
- Generates realistic mock data based on your schemas
- Handles authentication and responds with defined HTTP headers
- Supports Swagger 2.0 and OpenAPI 3.x documents
- Write custom JavaScript handlers for dynamic responses
- Automatically seed initial data on server startup
- Validates incoming requests against your OpenAPI contract

## Quickstart

The easiest way to get started is through [our Scalar CLI](../cli/getting-started.md).
You can have a mock server up and running in seconds:

```bash
npx @scalar/cli document mock openapi.json --watch
```

### Docker

Alternatively, you can run the mock server in a Docker container. See the [Docker documentation](docker.md) for more details.

## Installation

For advanced use cases, you can integrate the mock server directly into your Node.js application for full control:

```bash
npm install @scalar/mock-server
```

## Usage

```typescript
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

// Your OpenAPI document
const document = {
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
  document,
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

```typescript
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

// Your OpenAPI document
const document = {
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
  document,
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

### Selecting responses

By default the mock server picks a response (and its status code) for you and returns the first example it can find. You can override both with the standard [`Prefer` header](https://www.rfc-editor.org/rfc/rfc7240), just like [Stoplight Prism](https://github.com/stoplightio/prism).

Use `code=<status>` to request a specific response status:

```bash
# Returns the 404 response defined for the operation
curl http://localhost:3000/users/1 -H 'Prefer: code=404'
```

Use `example=<name>` to pick a named example from the `examples` map:

```bash
# Returns the `bob` example from the response
curl http://localhost:3000/users -H 'Prefer: example=bob'
```

Both directives are independent and can be combined. `code=` picks the response, then `example=` picks the example within it:

```bash
curl http://localhost:3000/users -H 'Prefer: code=422, example=missingEmail'
```

Unknown values fall back to the default behavior, so an undefined status code or example name never errors.

To define multiple examples, use the `examples` map on the response media type:

```typescript
const document = {
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                examples: {
                  alice: {
                    value: { name: 'Alice' },
                  },
                  bob: {
                    value: { name: 'Bob' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
```

## Advanced Features

### Request Validation

The mock server enforces your OpenAPI contract by default. Each request is validated against the matched operation before a mock response is generated:

- **Path, query, header, and cookie parameters** declared in the operation are validated against their schema. Values arrive as strings, so `type: integer`/`boolean` are coerced before validation (for example `?limit=10` becomes the number `10`). Required parameters are enforced. Header names are matched case-insensitively, and the `Accept`, `Content-Type`, and `Authorization` headers are ignored as parameters because OpenAPI defines them elsewhere.
- **Array parameters** are deserialized according to their `style` and `explode` before validation. Exploded `form` arrays read repeated query keys (`?ids=1&ids=2`), while `form` (non-exploded), `spaceDelimited`, and `pipeDelimited` query arrays, plus `simple` path and header arrays and `form` cookie arrays, are split on their delimiter (for example `?ids=1,2,3` or `X-Ids: 1,2,3`).
- **Object parameters** are deserialized too: `deepObject` (`?filter[min]=1&filter[max]=9`), exploded `form` (properties as top-level keys, `?r=100&g=200`), non-exploded `form`/`simple` (alternating `key,value`, for example `r,100,g,200`), and exploded `simple` (`key=value` pairs, for example `r=100,g=200`).
- **JSON request bodies** are validated against `requestBody.content['application/json'].schema`, and `requestBody.required` is enforced.

When a request violates the contract, the server responds with `422 Unprocessable Entity` and a `application/problem+json` body listing every violation, instead of a mock response.

To turn this off and always return a mock response regardless of the request, set `validateRequest: false`:

```ts
import { createMockServer } from '@scalar/mock-server'

const app = await createMockServer({
  document,
  // Opt out of request validation
  validateRequest: false,
})
```

A failing request (for example a missing required `limit` query parameter and a wrong-typed body field) returns:

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json
```

```json
{
  "error": "Request validation failed",
  "violations": [
    { "location": "query", "path": "/limit", "message": "limit must be integer" },
    { "location": "body", "path": "/age", "message": "must be integer" }
  ]
}
```

Each violation reports its `location` (`path`, `query`, `header`, `cookie`, or `body`), a `path` pointing at the offending value, and a human-readable `message`. All violations are returned at once, not just the first.

> This validates path, query, header, and cookie parameters (including array and object serialization), plus JSON request bodies. The rarer `label`/`matrix` path styles, response validation, non-JSON bodies, and proxy mode are planned follow-ups.

### Custom Request Handlers

Use the `x-handler` extension to write custom JavaScript code for handling requests. This gives you access to a `store` helper for data persistence, `faker` for generating realistic data, and full access to request/response objects.

[Learn more about custom request handlers →](custom-request-handler.md)

### Data Seeding

Use the `x-seed` extension on your schemas to automatically populate initial data when the server starts. Perfect for having realistic test data available immediately.

[Learn more about data seeding →](data-seeding.md)
