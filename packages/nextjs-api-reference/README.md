# Scalar Next.js API Reference Component

[![Version](https://img.shields.io/npm/v/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Ffastify-api-reference)](https://www.npmjs.com/package/@scalar/nextjs-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Next.JS.

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

## Installation

```bash
npm install @scalar/nextjs-api-reference
```

## Usage

If you have a OpenAPI/Swagger file already, you can pass an URL to the plugin:

```ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const Page = () => {
  const config = {
    spec: {
      url: '/swagger.json'
    }
  }

  return <ApiReference config={config} />
}
export default Page
```

Or, if you just have a static OpenAPI spec, you can directly pass it, too:

```ts
const config = {
  spec: {
    content: '...',
  },
}
```

The Next.js component takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/packages/api-reference#configuration) in the core package README.

## Themes

By default, we’re using a custom Next.js theme and it’s beautiful. But you can choose [one of our other themes](https://github.com/scalar/scalar/tree/main/packages/themes), too:

```ts
const config = {
  theme: 'purple',
}
```
