# Scalar Next.js API Reference Handler

[![Version](https://img.shields.io/npm/v/%40scalar/nextjs-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/nextjs-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2fnextjs-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

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

```ts
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/openapi.json',
  },
}

export const GET = ApiReference(config)
```

Or, if you just have a static OpenAPI spec, you can directly pass it as well:

```ts
const config = {
  spec: {
    content: '...',
  },
}
```

We wrote a [detailed integration guide for Next.js](/documentation/integrations/nextjs.md).

The Next.js handler takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/documentation/configuration.md) in the core package README.

## Themes

By default, we’re using a custom Next.js theme and it’s beautiful. But you can choose [one of our other themes](https://github.com/scalar/scalar/tree/main/packages/themes), too:

```ts
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
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }}
    />
  )
}
```

### Specific CDN version

By default, this integration will use the latest version of the `@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```ts
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/openapi.json',
  },
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}

export const GET = ApiReference(config)
```
