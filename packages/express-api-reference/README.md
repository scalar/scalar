# Scalar Express API Reference Plugin

[![Version](https://img.shields.io/npm/v/%40scalar/express-api-reference)](https://www.npmjs.com/package/@scalar/express-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/express-api-reference)](https://www.npmjs.com/package/@scalar/express-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fexpress-api-reference)](https://www.npmjs.com/package/@scalar/express-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with Express.

## Installation

```bash
npm install @scalar/express-api-reference
```

## Usage

[Set up Express](https://expressjs.com/en/starter/hello-world.html) and pass an URL to an OpenAPI/Swagger document to the `apiReference` middleware:

> Wait, but how do we get the OpenApiSpecification? 🤔 There are multiple ways to generate an OpenAPI/Swagger file for Express. The most popular way is to use [`swagger-jsdoc`](https://github.com/Surnet/swagger-jsdoc).

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    spec: {
      // Put your OpenAPI url here:
      url: '/openapi.json',
    },
  }),
)
```

The Express middleware takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/packages/api-reference#props) in the core package README.

### Themes

The middleware comes with a custom theme for Express. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    theme: 'purple',
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

### Custom CDN

You can use a custom CDN ，default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
