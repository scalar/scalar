# Scalar API Reference for NestJS

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with NestJS.

## Installation

```bash
npm install @scalar/nestjs-api-reference
```

## Usage

[Set up NestJS](https://docs.nestjs.com/first-steps) and [set up NestJS Swagger](https://docs.nestjs.com/openapi/introduction) and pass an OpenAPI/Swagger document to the `apiReference` middleware:

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

/* ... */
const app = await NestFactory.create(AppModule)

const config = new DocumentBuilder()
  .setTitle('Cats example')
  .setDescription('The cats API description')
  .setVersion('1.0')
  .addTag('cats')
  .build()

const document = SwaggerModule.createDocument(app, config)
/* ... */

const OpenApiSpecification =
  /* … */

  app.use(
    '/reference',
    apiReference({
      content: document,
    }),
  )
```

Recommended: If you're serving an OpenAPI/Swagger file already, you can pass an URL, too:

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    url: '/openapi.json',
  }),
)
```

## Using with Fastify Adapter

When using NestJS with the Fastify adapter instead of Express, you need to set the `withFastify` option to `true`:

```ts
/* ... */

app.use(
  '/reference',
  apiReference({
    url: '/openapi.json',
    withFastify: true, // Required when using Fastify adapter
  }),
)
```

The NestJS middleware takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/packages/api-reference#props) in the core package README.

### Themes

The middleware comes with a custom theme for NestJS. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    theme: 'purple',
    url: '/openapi.json',
  }),
)
```

### Custom CDN

You can use a custom CDN ，default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
    content: OpenApiSpecification,
  }),
)
```
