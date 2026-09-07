# Next.js application recipes

These recipes build on the [Next.js integration](./nextjs.md). The reference lives at `/scalar` and the API description lives at `/openapi.json`.

## Protect the reference and the API description

Protecting a page does not protect a separate Route Handler. Apply your application's session and permission checks to both routes. Keep authentication checks on the server; configuration passed to Scalar is visible to the browser.

For a small internal reference, this complete HTTP Basic example uses two server environment variables, `DOCS_USER` and `DOCS_PASSWORD`. Set them in `.env.local` and in your deployment settings. Use HTTPS when deployed. It fails closed when either variable is missing.

```typescript
// app/lib/docs-auth.ts
import { createHash, timingSafeEqual } from 'node:crypto'

export const authorizeDocs = (request: Request): Response | undefined => {
  const username = process.env.DOCS_USER
  const password = process.env.DOCS_PASSWORD
  if (!username || !password) {
    return new Response('Documentation is unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  const actual = request.headers.get('authorization') ?? ''
  const digest = (value: string): Buffer => createHash('sha256').update(value).digest()
  if (!timingSafeEqual(digest(actual), digest(expected))) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="API documentation", charset="UTF-8"',
        'Cache-Control': 'private, no-store',
      },
    })
  }
}
```

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'
import { authorizeDocs } from '../lib/docs-auth'

export const runtime = 'nodejs'

export const GET = (request: Request): Response => {
  const denied = authorizeDocs(request)
  if (denied) return denied

  const response = ApiReference({ url: '/openapi.json', pageTitle: 'Internal API' })()
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
```

```typescript
// app/openapi.json/route.ts
import { authorizeDocs } from '../lib/docs-auth'

export const runtime = 'nodejs'

export const GET = (request: Request): Response => {
  const denied = authorizeDocs(request)
  if (denied) return denied

  return Response.json({
    openapi: '3.1.0',
    info: { title: 'Internal API', version: '1.0.0' },
    paths: {},
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
```

Move a private description out of `public/`; a static public copy would bypass these checks. For session-based authentication, replace `authorizeDocs` with your existing session and permission lookup. If that lookup is asynchronous, make both handlers asynchronous and await it.

Check that both URLs return `401` without credentials and `200` with valid credentials. Also check invalid credentials and missing environment variables. These routes protect documentation access. Your API endpoints still need their own authorization.

## Preview deployments

Use `url: '/openapi.json'` for a same-origin description. In that description, use a relative server URL when the API runs in the same application:

```json
{
  "servers": [{ "url": "/" }]
}
```

This follows the localhost or preview origin in the browser. Avoid hardcoding a production API hostname into a preview example. If the API is hosted elsewhere, configure an explicit public API URL per environment and allow requests from the documentation origin on that API.

## Applications with basePath

Next.js does not automatically add `basePath` to strings inside Scalar configuration or your API description. For this example:

```javascript
// next.config.mjs
export default { basePath: '/platform' }
```

Use `url: '/platform/openapi.json'` in the reference configuration and `servers: [{ url: '/platform' }]` in the API description. Keep operation paths such as `/api/planets` unchanged. Visit `/platform/scalar`; the test request should target `/platform/api/planets`.

Set the base path when building the application. Keep its value consistent in Next.js configuration, the description URL, and the API server URL.

## Request-specific configuration and CSP

Read dynamic values inside the handler, not once when the module is imported:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = (request: Request): Response => {
  const response = ApiReference({
    url: '/openapi.json',
    nonce: request.headers.get('x-nonce') ?? undefined,
  })()
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
```

Use the [CSP recipe](./nextjs.md#content-security-policy-csp) to generate and overwrite `x-nonce` in trusted Proxy or middleware and set the matching response policy. Do not trust a nonce supplied directly by a visitor. Next.js 16 uses `proxy.ts`; Next.js 15 uses `middleware.ts`.

A nonce must be fresh for every response. Do not statically cache or publicly cache a nonce-bearing or personalized reference. Keep inline-style support as explained in the CSP recipe.
