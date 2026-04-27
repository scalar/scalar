---
name: mock-server
description: Build, customize, and troubleshoot OpenAPI mock servers with @scalar/mock-server, including x-handler, x-seed, authentication, and Docker.
---

# Scalar Mock Server Skill

Reference for implementing and debugging mock APIs with `@scalar/mock-server`.
Use this when you need realistic API responses from an OpenAPI description document, custom request behavior, seeded data, or Docker-based mock environments.

## Overview

- Package: `@scalar/mock-server`
- Runtime: Node.js (package engine: `>=22`)
- Main API: `createMockServer(options)`
- Docs:
  - Getting started: <https://scalar.com/tools/mock-server/getting-started>
  - Custom request handlers (`x-handler`): <https://scalar.com/tools/mock-server/custom-request-handler>
  - Data seeding (`x-seed`): <https://scalar.com/tools/mock-server/data-seeding>
  - Docker: <https://scalar.com/tools/mock-server/docker>

## Quick Start

Fastest way to run a mock server from a local OpenAPI description:

```bash
npx @scalar/cli document mock openapi.json --watch
```

Programmatic setup:

```ts
import { serve } from '@hono/node-server'
import { createMockServer } from '@scalar/mock-server'

const app = await createMockServer({
  document: './openapi.yaml',
  onRequest({ context, operation }) {
    console.log(context.req.method, context.req.path, operation.operationId)
  },
})

serve({ fetch: app.fetch, port: 3000 })
```

## `createMockServer()` Options

At least one of the following is required:

- `document`: OpenAPI description document as URL, file path, or object
- `specification`: deprecated alias for `document`

Optional:

- `onRequest({ context, operation })`: callback before each request is processed

## Built-in Behavior

When the server starts, it:

1. Processes and loads the OpenAPI description document.
2. Seeds schema data from `x-seed` extensions (idempotent: only when collection is empty).
3. Registers authentication routes for declared security schemes.
4. Registers operation routes for each path + method.
5. Exposes the source document at:
   - `/openapi.json`
   - `/openapi.yaml`

## Custom Request Logic with `x-handler`

Use `x-handler` in an operation for dynamic behavior instead of static examples.

Helpers available in `x-handler`:

- `store` for in-memory persistence (`list`, `get`, `create`, `update`, `delete`, `clear`)
- `faker` for generated test data
- `req` for request data (`body`, `params`, `query`, `headers`)
- `res` for response examples by status code (`res['200']`, `res['404']`, ...)

Status behavior:

- `store.get()` / `store.update()` => `200` when found, `404` when not found
- `store.create()` => `201`
- `store.delete()` => `204` when deleted, `404` when not found
- `store.list()` => `200`
- Returning `null`/`undefined` triggers `404` (uses `responses.404` example/schema when provided)

## Seed Data with `x-seed`

Use `x-seed` on `components.schemas.<SchemaName>` to seed initial data at startup.

Helpers available in `x-seed`:

- `seed.count(n, factory)`
- `seed(array)`
- `seed(factory)` (single item shortcut)
- `faker`, `store`, and `schema`

Key rule: the schema key name is used as the collection name.

## Docker Usage

Run the Docker image:

```bash
docker run -p 3000:3000 scalarapi/mock-server --url https://api.example.com/openapi.yaml
```

Document source priority (high to low):

1. `--url <URL>`
2. `OPENAPI_DOCUMENT`
3. `OPENAPI_DOCUMENT_URL`
4. `/docs` volume-mounted files

Useful routes:

- Mock endpoints: from your OpenAPI paths
- API reference UI: `/scalar`
- Description document: `/openapi.json`, `/openapi.yaml`

## Troubleshooting Checklist

- Confirm the OpenAPI description document is valid and reachable.
- Confirm at least one document source is configured (`document`, `--url`, env var, or mounted file).
- If seeded data is missing, check `x-seed` exists on schema keys and the collection was empty on startup.
- If auth-protected routes return unauthorized responses, verify matching `securitySchemes` and request credentials.
- If custom logic fails, inspect `x-handler` runtime errors (mock server returns `500` with handler error details).
