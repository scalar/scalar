# Generate an API description from Zod schemas

This recipe uses ordinary Next.js Route Handlers and Zod 4. Zod generates response schemas; you explicitly describe paths, methods, and status codes. Scalar renders the resulting OpenAPI description at `/scalar`.

In an App Router application, install:

```bash
npm install @scalar/nextjs-api-reference zod@4
```

Define the response schema once:

```typescript
// app/lib/planets.ts
import { z } from 'zod'

export const planetsSchema = z.array(z.object({
  id: z.string(),
  name: z.string(),
  moons: z.number().int().nonnegative(),
}))

export const planets = planetsSchema.parse([
  { id: 'earth', name: 'Earth', moons: 1 },
  { id: 'mars', name: 'Mars', moons: 2 },
])
```

Use it in the endpoint:

```typescript
// app/api/planets/route.ts
import { planets } from '../../lib/planets'

export const GET = (): Response => Response.json(planets)
```

Generate the schema in the description endpoint:

```typescript
// app/openapi.json/route.ts
import { z } from 'zod'
import { planetsSchema } from '../lib/planets'

export const GET = (): Response => Response.json({
  openapi: '3.1.0',
  info: { title: 'Planets API', version: '1.0.0' },
  servers: [{ url: '/' }],
  paths: {
    '/api/planets': {
      get: {
        operationId: 'listPlanets',
        summary: 'List planets',
        responses: {
          '200': {
            description: 'The planet catalog.',
            content: { 'application/json': { schema: z.toJSONSchema(planetsSchema) } },
          },
        },
      },
    },
  },
})
```

Mount Scalar:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({ url: '/openapi.json' })
```

Run `npm run dev`, open <http://localhost:3000/scalar>, select **List planets**, open **Test Request**, and send. Expect `200` with Earth and Mars. `/openapi.json` should contain `/api/planets` and an array response schema.

The relative server URL follows localhost and preview deployments. There is no automatic route discovery here. If you already use [Hono](./hono.md) or [oRPC](./orpc.md), their route metadata can generate the paths too.

See [Zod JSON Schema conversion](https://zod.dev/json-schema) for unsupported schema types and conversion options. Scalar also has an experimental [`@scalar/nextjs-openapi`](https://github.com/scalar/scalar/tree/main/packages/nextjs-openapi) route scanner, currently labeled pre-alpha; it is a separate package from this renderer.
