# API Reference for tRPC

Use [`trpc-to-openapi`](https://github.com/mcampa/trpc-to-openapi) to expose selected tRPC procedures as REST endpoints and generate an OpenAPI description. The [Scalar Express integration](./express.md) renders that description as an interactive API reference.

## Installation

This example uses Node.js 24, tRPC 11, and Zod 4.

```bash
npm install @scalar/express-api-reference @trpc/server@11 express@4 trpc-to-openapi@3 zod@4 zod-openapi@5
```

## Serve the API reference

Save the following as `server.mts`. The REST adapter mounts at `/api`, so the OpenAPI server URL includes that prefix.

```typescript
import { Scalar } from '@scalar/express-api-reference'
import { initTRPC } from '@trpc/server'
import express from 'express'
import { createOpenApiExpressMiddleware, generateOpenApiDocument, type OpenApiMeta } from 'trpc-to-openapi'
import { z } from 'zod'

const t = initTRPC.meta<OpenApiMeta>().create()
const router = t.router({
  sayHello: t.procedure
    .meta({ openapi: { method: 'GET', path: '/hello', summary: 'Say hello', protect: false } })
    .input(z.object({ name: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .query(({ input }) => ({ greeting: `Hello, ${input.name}!` })),
})

const document = generateOpenApiDocument(router, {
  title: 'Greetings API',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000/api',
})

const app = express()

app.use('/api', createOpenApiExpressMiddleware({ router }))
app.use('/reference', Scalar({ content: document }))
app.listen(3000, 'localhost')
```

Run `node server.mts` and open <http://localhost:3000/reference>. Select **Say hello**, click **Test Request**, enter `Scalar` as the `name` query parameter, and send the request. `GET /api/hello?name=Scalar` returns `{"greeting":"Hello, Scalar!"}`.

In an existing app, mount the REST adapter alongside your tRPC handler. Add `meta.openapi` to the procedures you want to expose through the REST adapter.
