# Generate a Next.js API description with oRPC

Use oRPC procedure metadata for HTTP routing and OpenAPI generation, then display the generated description with Scalar at `/scalar`.

This recipe was checked with oRPC 1.15.0 and Zod 4:

```bash
npm install @scalar/nextjs-api-reference @orpc/server@1.15.0 @orpc/openapi@1.15.0 @orpc/zod@1.15.0 zod@4
```

Define an HTTP procedure:

```typescript
// app/lib/router.ts
import { os } from '@orpc/server'
import { z } from 'zod'

export const router = {
  listPlanets: os
    .route({ method: 'GET', path: '/planets', summary: 'List planets' })
    .output(z.array(z.object({ id: z.string(), name: z.string(), moons: z.number().int() })))
    .handler(() => [
      { id: 'earth', name: 'Earth', moons: 1 },
      { id: 'mars', name: 'Mars', moons: 2 },
    ]),
}
```

Use the Fetch adapter in a Route Handler:

```typescript
// app/api/[[...route]]/route.ts
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { router } from '../../lib/router'

const handler = new OpenAPIHandler(router)

export const GET = async (request: Request): Promise<Response> => {
  const { response } = await handler.handle(request, { prefix: '/api' })
  return response ?? new Response('Not found', { status: 404 })
}
```

Generate the description with the Zod 4 converter:

```typescript
// app/openapi.json/route.ts
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { router } from '../lib/router'

const generator = new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] })

export const GET = async (): Promise<Response> => Response.json(await generator.generate(router, {
  info: { title: 'Planets API', version: '1.0.0' },
  servers: [{ url: '/api' }],
}))
```

Mount Scalar:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({ url: '/openapi.json' })
```

Run `npm run dev`, open <http://localhost:3000/scalar>, and send a test request for **List planets**. Expect `200` with Earth and Mars. The generated path is `/planets` and the server URL is `/api`, giving `/api/planets`.

When adding other HTTP methods, export the matching Next.js handler too. oRPC generates this description from the router and schema converter; Scalar does not inspect your procedures. See [oRPC's OpenAPI generator](https://orpc.dev/docs/openapi/specification) and [Next.js adapter](https://orpc.dev/docs/adapters/next).
