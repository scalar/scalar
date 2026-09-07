# API Reference for Next.js

Add interactive API documentation to your Next.js application from an OpenAPI description.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/scalar/scalar/assets/2039539/5837adad-a605-4edb-90ec-b929ff2b803b">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
  <img alt="Screenshot of an API Reference" src="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
</picture>

## Choose how to render Scalar

|                                  | Standalone reference           | Embedded page                               |
| -------------------------------- | ------------------------------ | ------------------------------------------- |
| Package                          | `@scalar/nextjs-api-reference` | `@scalar/api-reference-react`               |
| File                             | `app/scalar/route.ts`          | `app/scalar/page.tsx`                       |
| Application layout and providers | Separate HTML document         | Uses your application layout                |
| Styling                          | Scalar configuration           | Application styles and Scalar configuration |
| Metadata                         | `pageTitle`                    | Next.js Metadata API                        |

Choose one approach for `/scalar`. Next.js does not allow `route.ts` and `page.tsx` at the same route. If your project uses `src/`, put these files under `src/app/`.

Both approaches render the interactive reference in the browser. Returning HTML from the handler does not server-render the API content.

## Standalone reference

```bash
npm install @scalar/nextjs-api-reference
```

Put your API description in `public/openapi.json`, then create:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  url: '/openapi.json',
  pageTitle: 'My API',
})
```

Open <http://localhost:3000/scalar>. The browser fetches `/openapi.json`; Scalar does not discover your application routes or generate the description.

You can also import a JSON description and pass it as `content` instead of `url`:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

import document from '../../openapi.json'

export const GET = ApiReference({ content: document })
```

In this example, the JSON file is `openapi.json` at the project root. Its contents are included in the response sent to the browser.

The standalone reference has its own HTML document. Your `app/layout.tsx`, React providers, global CSS, and Next.js metadata do not apply to it. Use `pageTitle`, `theme`, and `customCss` from the [configuration](../configuration.md) to customize it. For example, choose [one of our themes](../themes.md):

```typescript
export const GET = ApiReference({
  url: '/openapi.json',
  theme: 'purple',
})
```

### Pin the browser renderer

The handler generates HTML that loads Scalar from a CDN. Pinning `@scalar/nextjs-api-reference` in your lockfile does not pin that browser renderer. The default CDN URL follows the latest release.

For repeatable deployments, choose an exact published renderer version and update it deliberately. This example uses `1.67.0`:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  url: '/openapi.json',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
})
```

`cdn` selects the classic UMD bundle. To pin the modern ESM entry point instead, use `bundle`:

```typescript
export const GET = ApiReference({
  url: '/openapi.json',
  bundle: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0/esm.js',
})
```

| Configuration                  | Browser renderer                                     |
| ------------------------------ | ---------------------------------------------------- |
| No `cdn`, `bundle`, or `nonce` | Latest ESM build with lazy-loaded chunks             |
| `cdn: '…'`                     | UMD build from that URL                              |
| `bundle: '…'`                  | ESM entry point from that URL                        |
| `bundle: false`                | UMD build                                            |
| `nonce` without `bundle`       | UMD build compatible with nonce-only script policies |

An explicit `bundle` takes precedence over `cdn` and the nonce fallback. ESM imports cannot carry a nonce onto each downloaded chunk. Use the UMD default for nonce-only policies, or allow module loading through an appropriate CDN source policy or `strict-dynamic` before choosing ESM.

After changing a pinned version, check rendering, search, and test requests in your application. For CSP deployments, check the browser console for blocked resources too. [Browse published renderer versions](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files).

### Content Security Policy (CSP)

To boot the reference, Scalar adds an inline `<script>` to the page. Under a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) that script is blocked unless you allow `unsafe-inline` (which defeats the purpose of a CSP).

Instead, pass a `nonce`. Scalar stamps it onto the inline script and the CDN `<script>` tag, so you can keep a strict `script-src` with **no `unsafe-inline` and no `unsafe-eval`**.

A nonce has to be generated fresh for every request, so generate it in `proxy.ts` on Next.js 16, expose it to the route through a request header, and set the matching CSP response header:

```typescript
// proxy.ts (Next.js 16)
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // A fresh nonce per request.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const csp = [
    `default-src 'self'`,
    // Scripts are locked down to the nonce — no unsafe-inline, no unsafe-eval.
    `script-src 'nonce-${nonce}'`,
    // Styles still need 'unsafe-inline' (see the note below).
    `style-src 'unsafe-inline'`,
    // Allow the OpenAPI document and any other resources you load.
    `connect-src 'self' https:`,
    `img-src 'self' data: https:`,
    `font-src 'self' https:`,
  ].join('; ')

  // Pass the nonce to the route handler via a request header.
  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: '/scalar/:path*',
}
```

On Next.js 15, name the file `middleware.ts` and export `middleware` instead of `proxy`.

Only accept the nonce from trusted Proxy or middleware that overwrites the request header. Use `Cache-Control: private, no-store` on nonce-bearing responses so each response gets a fresh nonce.

Then read the nonce in the route handler and pass it to the configuration:

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'
import { headers } from 'next/headers'

export async function GET() {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return ApiReference({
    url: '/openapi.json',
    nonce,
  })()
}
```

The same `nonce` option is available in all of our HTML-rendering integrations (Express, Fastify, NestJS, Hono, SvelteKit and Astro).

> [!NOTE]
> **`style-src` still needs `'unsafe-inline'`.** The reference renders many inline `style="…"` attributes, and a CSP nonce can never authorize inline style attributes — only `<script>`, `<style>` and `<link>` elements. So `style-src` cannot be locked down to a nonce today. The `nonce` is still applied to Scalar's own style tags (and a matching `<meta property="csp-nonce">` is emitted), but `style-src 'unsafe-inline'` remains required. The important win is `script-src`, which you can keep fully strict.

## Embedded App Router page

```bash
npm install @scalar/api-reference-react
```

Keep the page as a Server Component so it can export metadata:

```tsx
// app/scalar/page.tsx
import type { Metadata } from 'next'
import { Reference } from './reference'

export const metadata: Metadata = {
  title: 'My API',
  description: 'Explore and test the My API endpoints.',
}

export default function Page() {
  return <Reference />
}
```

Put browser configuration and callbacks in a Client Component:

```tsx
// app/scalar/reference.tsx
'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export function Reference() {
  return (
    <ApiReferenceReact
      configuration={{
        url: '/openapi.json',
        withDefaultFonts: false,
      }}
    />
  )
}
```

This page inherits your layout, navigation, and providers. Disable Scalar's default fonts when using your application's fonts. See [themes](../themes.md) for font variables and matching your application's dark mode. Props passed from a Server Component to a Client Component must be serializable; define callbacks inside the Client Component.

### Tailwind CSS

For the embedded reference with Tailwind CSS v4, set the layer order at the top of your global CSS:

```css
@layer scalar-base, scalar-theme, scalar-config, theme, base, components, utilities;
@import 'tailwindcss';
```

See [Embedding with CSS Frameworks](../themes.md#embedding-with-css-frameworks). Application CSS does not affect the standalone handler.

## Pages Router

Use `@scalar/api-reference-react` in `pages/scalar.tsx`. Import its global stylesheet in `pages/_app.tsx`:

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app'
import '@scalar/api-reference-react/style.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

```tsx
// pages/scalar.tsx
import { ApiReferenceReact } from '@scalar/api-reference-react'
import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head>
        <title>My API</title>
      </Head>
      <ApiReferenceReact configuration={{ url: '/openapi.json' }} />
    </>
  )
}
```

## Compatibility

The handler supports Next.js 15 and 16 with React 19 and Node.js 22 or newer.

The compatibility workflow builds a real Next.js application and checks browser rendering and CSP nonces:

| Next.js | React | Node.js CI matrix |
| ------- | ----- | ----------------- |
| 15.5.15 | 19    | 22, 24            |
| 16.3.4  | 19    | 22, 24            |

See [the compatibility workflow](https://github.com/scalar/scalar/actions/workflows/nextjs-compatibility.yml) for results. These checks cover the standalone handler; the React package has its own tests.

## Generate your API description

Choose the recipe that matches your application's routing:

- [Next.js Route Handlers with Zod](./nextjs-recipes/route-handlers.md)
- [Hono with Zod OpenAPI](./nextjs-recipes/hono.md)
- [oRPC procedures](./nextjs-recipes/orpc.md)

Each recipe includes a working endpoint, the generated OpenAPI description, and Scalar at `/scalar`.

## Production setup

### Protect private documentation

Apply your application's server-side session and permission checks to both `/scalar` and `/openapi.json`. Protecting the reference alone leaves the API description accessible. Serve private descriptions from an authenticated Route Handler instead of `public/`, and use `Cache-Control: private, no-store` on both responses.

Scalar configuration is visible to the browser, so keep server credentials out of it. Your API endpoints still need their own authorization.

### Preview deployments and base paths

Use `url: '/openapi.json'` and `servers: [{ url: '/' }]` in your API description when the API runs in the same application. These URLs follow the current origin, so localhost and preview deployments use their own API.

If Next.js has `basePath: '/platform'`, include that prefix explicitly in Scalar's configuration and the API description:

- Reference URL: `/platform/scalar`
- Scalar configuration: `url: '/platform/openapi.json'`
- API description: `servers: [{ url: '/platform' }]`

Keep operation paths such as `/api/planets` unchanged. Next.js does not add its base path to URLs inside Scalar configuration or an API description.

## Request-specific configuration

Pass a function when the browser configuration depends on the incoming request. The function runs for each request and may return a promise. Configuration errors propagate to Next.js.

```typescript
// app/scalar/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference(
  (request) => ({
    url: '/openapi.json',
    nonce: request.headers.get('x-nonce') ?? undefined,
  }),
  { headers: { 'Cache-Control': 'private, no-store' } },
)
```

Generate the nonce in your trusted Proxy or middleware and set the matching CSP response header, as described above. Configuration is sent to the browser, so do not include server secrets. Additional response headers can be supplied as a `Headers` object, header tuples, or a record. The handler always sets the HTML content type.

The package exports `ApiReferenceConfiguration`, `ApiReferenceConfigurationFactory`, and `ApiReferenceOptions` for typed configuration helpers. Static configuration still returns a synchronous handler; a configuration function returns an asynchronous handler that requires a `Request`.
