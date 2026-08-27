# Mock Server
<div class="flex gap-2">
<a href="https://www.npmjs.com/@scalar/mock-server" aria-label="View @scalar/mock-server on NPM"><img alt="NPM Version" src="https://img.shields.io/npm/v/@scalar/mock-server"></a>
<a href="https://www.npmjs.com/@scalar/mock-server" aria-label="View NPM downloads for @scalar/mock-server"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@scalar/mock-server"></a>
<a href="https://discord.gg/scalar" aria-label="Join Scalar community on Discord"><img alt="Discord" src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

A powerful Node.js mock server that automatically generates realistic API responses from your API documents. It creates fully-functional endpoints with mock data, handles authentication, and respects content types - making it perfect for frontend development, API prototyping, and integration testing.

## Features

- Perfect for frontend development and testing
- Creates endpoints automatically from your API documents
- Generates realistic mock data based on your schemas
- Handles authentication and responds with defined HTTP headers
- Supports Swagger 2.0 and OpenAPI 3.x documents
- Mocks event-driven APIs from AsyncAPI 3.1 documents over WebSocket and SSE
- Streams `text/event-stream` responses as real Server-Sent Events
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

### Path keys with a query string

Some documents describe a variant of an operation by putting a query string in the path key:

```yaml
paths:
  /v1/messages: …
  /v1/messages?beta=true: …
```

Both keys are routed. The variant answers only requests that actually send every query parameter it pins (`?beta=true` here), and the plain key answers everything else. A key that pins a name without a value (`?beta`) matches any value.

Everything else in a path key is matched literally, so a path such as `/users:batchGet` or `/reports*` is served as written.

A segment that mixes a path parameter with literal text of that kind (`/v1/jobs/{jobId}:cancel`) routes to the right operation, but `jobId` is not bound by name — a single path segment can only carry one parameter. Request validation reads it as missing, so give such an operation `validateRequest: false`.

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
- **Array parameters** are deserialized according to their `style` and `explode` before validation. Exploded `form` arrays read repeated query keys (`?ids=1&ids=2`), while `form` (non-exploded), `spaceDelimited`, and `pipeDelimited` query arrays, `simple` path and header arrays, `form` cookie arrays, and the `label` (`/.1.2.3`) and `matrix` (`/;ids=1;ids=2`) path styles are split on their delimiter.
- **Object parameters** are deserialized too: `deepObject` (`?filter[min]=1&filter[max]=9`), exploded `form` (properties as top-level keys, `?r=100&g=200`), `form`/`simple`/`label`/`matrix` in both explode modes (for example `r,100,g,200`, `r=100,g=200`, or `;point=x,1,y,2`).
- **JSON request bodies** are validated against `requestBody.content['application/json'].schema`, and `requestBody.required` is enforced.
- **Recursive schemas** (a schema that references itself, directly or through another schema) are validated down to the point where the cycle is cut. Values at and below that recursion point are accepted as they are, and a `not`, `if`, `oneOf`, or `contains` that depends on the recursion is not enforced — nor are the keywords that only qualify them, such as `unevaluatedProperties`, `unevaluatedItems`, or `additionalProperties` — so validation stays on the forgiving side.

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

> This validates path, query, header, and cookie parameters (across every OpenAPI serialization style, including array and object values), plus JSON request bodies. Response validation, non-JSON bodies, and proxy mode are planned follow-ups.

### Server-Sent Events

When `text/event-stream` is the negotiated response media type, the response is streamed as real Server-Sent Events: every event goes out as a `data:` line terminated by a blank line, and the stream closes when the last event is written.

```typescript
const document = {
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/events': {
      get: {
        responses: {
          '200': {
            description: 'Server-Sent Events stream. Emits a summary event, then one row event.',
            content: {
              'text/event-stream': {
                examples: {
                  summary: {
                    value: { total_rows: 2 },
                  },
                  row: {
                    value: { count: 42 },
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

```bash
curl http://localhost:3000/events -H 'Accept: text/event-stream'
```

```text
data: {"total_rows":2}

data: {"count":42}
```

How the events are picked:

- Named `examples` are read as the sequence of events the endpoint emits, in declaration order. `Prefer: example=<name>` still works and pins the stream to that one example.
- An array example is read as the event sequence too, one event per item.
- An example that already spells out the wire format — `data:` and `event:` lines, or a `:` comment heartbeat — is written as its own framing, with only its terminating blank line normalized, instead of being wrapped in a second `data:` line. Examples like that describe a whole stream, so a map of them lists alternatives: the first one is served, and `Prefer: example=<name>` picks another.
- When the response only has a schema, the generated payload is sent three times, so a client's read loop sees more than one event before the stream ends. A schema that already generates a sequence — an `array` with more than one item, or a string that spells the wire format out — is sent once, not repeated.

### Error Responses

When mocking a request fails in a way nothing else handles — a declared response header name that is not a valid HTTP header name, an example that cannot be serialized — the server responds with `500 Internal Server Error` and a JSON body naming the operation that failed:

```json
{
  "error": "Internal Server Error",
  "message": "Headers.set: \"X Invalid Name\" is an invalid header name.",
  "operation": {
    "method": "GET",
    "path": "/pets/{petId}",
    "operationId": "getPet"
  }
}
```

`operation` reports the HTTP method and the OpenAPI path key of the matched operation, plus its `operationId` when the document declares one. It is left out when the request did not match a mocked operation, for example on a route you added to the returned app yourself. Either way, the error is also logged to the console, so the stack trace stays available.

Failures that are already handled elsewhere never reach this handler, so they keep their own shape and carry no `operation` key:

- **`x-handler` errors** — an extension that throws responds with `{ "error": "Handler execution failed", "message": … }`.
- **Operations with no response** — an operation whose `responses` are empty responds with `{ "error": "No response defined for this operation." }`.
- **Errors that carry a response** — an error such as Hono's `HTTPException` keeps the status and body it chose, and is not logged.

### Custom Request Handlers

Use the `x-handler` extension to write custom JavaScript code for handling requests. This gives you access to a `store` helper for data persistence, `faker` for generating realistic data, and full access to request/response objects.

[Learn more about custom request handlers →](custom-request-handler.md)

### Data Seeding

Use the `x-seed` extension on your schemas to automatically populate initial data when the server starts. Perfect for having realistic test data available immediately.

[Learn more about data seeding →](data-seeding.md)

### AsyncAPI Mocking

Point the mock server at an AsyncAPI 3.1 document to mock event-driven APIs. Channels are served over WebSocket and Server-Sent Events, and messages are generated from each message's payload schema. Additional protocols can be plugged in through the `transports` extension point.

[Learn more about AsyncAPI mocking →](asyncapi.md)
