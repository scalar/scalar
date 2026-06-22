# API Reference for Next.js

Next.js enables you to create high-quality web applications with the power of React components. And Scalar enables you to create high-quality API references. What a match, isn't it?

This plugin provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with Next.js.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/scalar/scalar/assets/2039539/5837adad-a605-4edb-90ec-b929ff2b803b">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
  <img alt="Screenshot of an API Reference" src="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
</picture>

## Installation

```bash
npm install @scalar/nextjs-api-reference
```

## Compatibility

This package is compatible with Next.js 15 and is untested on Next.js 14. If you want guaranteed Next.js 14 support
please use version `0.4.106` of this package.

## Usage

If you have a OpenAPI/Swagger file already, you can pass a URL to the plugin in an API [Route](https://nextjs.org/docs/app/building-your-application/routing/route-handlers):

```typescript
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: '/openapi.json',
}

export const GET = ApiReference(config)
```

Or, if you just have a static OpenAPI spec, you can directly pass it as well:

```typescript
const config = {
  content: '{ "openapi": "3.1.1", … }',
}
```

The Next.js handler takes our universal configuration object, [read more about configuration](../configuration.md) in the core package README.

## Themes

By default, we're using a custom Next.js theme and it's beautiful. But you can choose [one of our other themes](../themes.md), too:

```typescript
const config = {
  theme: 'purple',
}
```

## Pages router

If you are using the pages router, you can import the React component

```bash
npm install @scalar/api-reference-react
```

```tsx
'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'

import '@scalar/api-reference-react/style.css'

export default function References() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
      }}
    />
  )
}
```

### Specific CDN version

By default, this integration will use the latest version of the `@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```typescript
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: '/openapi.json',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}

export const GET = ApiReference(config)
```

### Content Security Policy (CSP)

To boot the reference, Scalar adds an inline `<script>` to the page. Under a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) that script is blocked unless you allow `unsafe-inline` (which defeats the purpose of a CSP).

Instead, pass a `nonce`. Scalar stamps it onto the inline script and the CDN `<script>` tag, so you can keep a strict `script-src` with **no `unsafe-inline` and no `unsafe-eval`**.

A nonce has to be generated fresh for every request, so generate it in `middleware.ts`, expose it to the route through a request header, and set the matching CSP response header:

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
  matcher: '/reference/:path*',
}
```

Then read the nonce in the route handler and pass it to the configuration:

```typescript
// app/reference/route.ts
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

## Guide

### Create a new Next.js project (optional)

Sometimes, it's great to start on a blank slate and set up a new project:

```bash
npx create-next-app@latest my-awesome-app
```

You'll get some questions, you can leave all the default answers – or pick what you prefer:

```plaintext
? Would you like to use TypeScript? › No
? Would you like to use ESLint? › No
? Would you like to use Tailwind CSS? … No
? Would you like to use `src/` directory? › No
? Would you like to use App Router? (recommended) › Yes
? Would you like to customize the default import alias (@/*)? … No
```

That should be it. Jump into the folder and start the development server:

```bash
cd my-awesome-app
npm run dev
```

Great! Open <http://localhost:3000> and see the default Next.js homepage. :)

### Render your OpenAPI reference with Scalar

Ready to add your API reference? Cool, there are a few options to integrate your API reference. The recommended way is to use our Next.js integration for app routing:

#### Recommended: App router

Install the package:

```bash
npm add @scalar/nextjs-api-reference
```

… and add a new app route:

```javascript
// app/reference/route.js
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=yaml',
}

export const GET = ApiReference(config)
```

Open <http://localhost:3000/reference> and there it is: Your new API reference. :)

### Using with Tailwind CSS

If your Next.js project uses Tailwind CSS v4, you need to set the CSS layer order so that Tailwind's utility classes take priority over Scalar's styles. Add this to the top of your global CSS file (for example, `app/globals.css`):

```css
@layer scalar-base, scalar-theme, scalar-config, theme, base, components, utilities;
@import "tailwindcss";
```

For full details, see [Embedding with CSS Frameworks](../themes.md#embedding-with-css-frameworks).

#### Alternative: Pages router

But you can also just use our React integration and add a page route:

```bash
npm add @scalar/api-reference-react
```

… and add a new page route:

```javascript
import { ApiReferenceReact } from '@scalar/api-reference-react'

import '@scalar/api-reference-react/style.css'

export default function References() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=yaml',
      }}
    />
  )
}
```
