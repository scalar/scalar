# Generate a Next.js API description with Hono

Hono and `@hono/zod-openapi` can validate route data and generate an OpenAPI description from route metadata. Scalar renders it at `/scalar`.

In an App Router application, install:

```bash
npm install @scalar/nextjs-api-reference hono@4 @hono/zod-openapi@1 zod@4
```

Define the endpoint and its schema:

```typescript
// app/lib/api.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

export const api = new OpenAPIHono().basePath('/api')

const planetsSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  moons: z.number().int().nonnegative(),
}))

api.openapi(createRoute({
  method: 'get',
  path: '/planets',
  summary: 'List planets',
  responses: {
    200: {
      description: 'The planet catalog.',
      content: { 'application/json': { schema: planetsSchema } },
    },
  },
}), (context) => context.json([
  { id: 'earth', name: 'Earth', moons: 1 },
  { id: 'mars', name: 'Mars', moons: 2 },
], 200))
```

Connect Hono to Next.js:

```typescript
// app/api/[[...route]]/route.ts
import { handle } from 'hono/vercel'
import { api } from '../../lib/api'

export const GET = handle(api)
```

Expose the generated description:

```typescript
// app/openapi.json/route.ts
import { api } from '../lib/api'

export const GET = (): Response => Response.json(api.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'Planets API', version: '1.0.0' },
  servers: [{ url: '/' }],
}))
```

Mount Scalar:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({ url: '/openapi.json' })
```

Run `npm run dev`, open <http://localhost:3000/scalar>, and send a test request for **List planets**. Expect `200` with Earth and Mars. The description should contain `/api/planets`; the server URL is `/`, so the `/api` prefix appears only once.

Hono generates descriptions for routes registered with `api.openapi`. Adding an ordinary Next.js handler elsewhere does not automatically add it to Hono's description. See [Hono's Next.js adapter](https://hono.dev/docs/getting-started/nextjs) and [Zod OpenAPI](https://hono.dev/examples/zod-openapi).
