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

Set up [Zod OpenAPI Hono](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) and pass the configured URL to the `apiReference` middleware:

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

The Hono middleware takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/blob/main/documentation/configuration.md) in the core package README.

### Themes

The middleware comes with a custom theme for Hono. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get(
  '/reference',
  apiReference({
    theme: 'purple',
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

### Custom page title

There’s one additional option to set the page title:

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get(
  '/reference',
  apiReference({
    pageTitle: 'Hono API Reference',
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

### Custom CDN

You can use a custom CDN ，default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
    spec: {
      content: OpenApiSpecification,
    },
  }),
)
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
