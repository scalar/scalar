# Scalar API Reference for Next.js

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

```ts
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: '/openapi.json',
}

export const GET = ApiReference(config)
```

Or, if you just have a static OpenAPI spec, you can directly pass it as well:

```ts
const config = {
  content: '{ "openapi": "3.1.1", … }',
}
```

The Next.js handler takes our universal configuration object, [read more about configuration](https://guides.scalar.com/scalar/scalar-api-references/configuration) in the core package README.

## Themes

By default, we're using a custom Next.js theme and it's beautiful. But you can choose [one of our other themes](https://guides.scalar.com/scalar/scalar-api-references/themes), too:

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
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
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
  url: '/openapi.json',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}

export const GET = ApiReference(config)
```


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

```js
// app/reference/route.js
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
}

export const GET = ApiReference(config)
```

Open <http://localhost:3000/reference> and there it is: Your new API reference. :)

#### Alternative: Pages router

But you can also just use our React integration and add a page route:

```bash
npm add @scalar/api-reference-react
```

… and add a new page route:

```js
import { ApiReferenceReact } from '@scalar/api-reference-react'

import '@scalar/api-reference-react/style.css'

export default function References() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
      }}
    />
  )
}
```
