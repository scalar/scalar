# Scalar for Hono

[![Version](https://img.shields.io/npm/v/%40scalar/hono-api-reference)](https://www.npmjs.com/package/@scalar/hono-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/hono-api-reference)](https://www.npmjs.com/package/@scalar/hono-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fhono-api-reference)](https://www.npmjs.com/package/@scalar/hono-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger document with Hono.

![hono-js](https://github.com/scalar/scalar/assets/6176314/6f5a2102-e377-4d4e-9cfb-a512f5e0a9ba)

## Installation

```bash
npm install @scalar/hono-api-reference
```

## Usage

Set up [Zod OpenAPI Hono](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) or [Hono OpenAPI](https://github.com/rhinobase/hono-openapi) and pass the configured URL to the `Scalar` middleware:

```ts
import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'

const app = new Hono()

// Use the middleware to serve the Scalar API Reference at /scalar
app.get('/scalar', Scalar({ url: '/doc' }))

export default app
```

The Hono middleware takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/blob/main/documentation/configuration.md) in the core package README.

### Themes

The middleware comes with a custom theme for Hono. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```ts
import { Scalar } from '@scalar/hono-api-reference'

// Switch the theme (or pass other options)
app.get('/scalar', Scalar({
  url: '/doc',
  theme: 'purple',
}))
```

### Custom page title

There’s one additional option to set the page title:

```ts
import { Scalar } from '@scalar/hono-api-reference'

// Set a page title
app.get('/scalar', Scalar({
  url: '/doc',
  pageTitle: 'Awesome API',
}))
```

### Custom CDN

You can use a custom CDN ，default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```ts
import { Scalar } from '@scalar/hono-api-reference'

app.get('/scalar', Scalar({ url: '/doc', pageTitle: 'Awesome API' }))

app.get('/scalar', Scalar({
  url: '/doc',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}))
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
