# Scalar API Reference for Express

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with Express.

![Screenshot of the Express integration](/screenshots/express.png)

## Installation

```bash
npm install @scalar/express-api-reference
```

## Usage

[Set up Express](https://expressjs.com/en/starter/hello-world.html) and pass an URL to an OpenAPI/Swagger document to the `apiReference` middleware:

> Wait, but how do we get the OpenAPI document? 🤔 There are multiple ways to generate an OpenAPI file for Express. The most popular way is to use [`swagger-jsdoc`](https://github.com/Surnet/swagger-jsdoc).

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    // Put your OpenAPI url here:
    url: '/openapi.json',
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
    url: '/openapi.json',
  }),
)
```

### Custom CDN

You can use a custom CDN, default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    url: '/openapi.json',
  }),
)
```

## Usage with Express Zod API

The wonderful `express-zod-api` package makes it easy to generate an OpenAPI document for your Express API.

To render a beautiful UI using [Scalar](https://github.com/scalar/scalar), you just need to install our integration:

```bash
npm install @scalar/express-api-reference
```

And then hook into Express and pass the `apiReference` middleware with the OpenAPI document:

```typescript
import { createConfig } from 'express-zod-api'
import { apiReference } from '@scalar/express-api-reference'

const config = createConfig({
  beforeRouting: ({ app, getLogger }) => {
    const logger = getLogger()
    logger.info('Serving the API reference at https://example.com/docs')

    app.use(
      '/docs',
      apiReference({
        // Pass your generated OpenAPI document
        content: documentation.getSpecAsJson(),
      }),
    )
  },
})
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
