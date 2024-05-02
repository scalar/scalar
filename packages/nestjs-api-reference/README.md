# Scalar NestJS API Reference Plugin

[![Version](https://img.shields.io/npm/v/%40scalar/nestjs-api-reference)](https://www.npmjs.com/package/@scalar/nestjs-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/nestjs-api-reference)](https://www.npmjs.com/package/@scalar/nestjs-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fnestjs-api-reference)](https://www.npmjs.com/package/@scalar/nestjs-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with NestJS.

## Installation

```bash
npm install @scalar/nestjs-api-reference
```

## Usage

[Set up NestJS](https://docs.nestjs.com/first-steps) and [set up NestJS Swagger](https://docs.nestjs.com/openapi/introduction) and pass an OpenAPI/Swagger spec to the `apiReference` middleware:

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
      spec: {
        content: document,
      },
    }),
  )
```

If you’re serving an OpenAPI/Swagger file already, you can pass an URL, too:

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
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
    spec: {
      content: OpenApiSpecification,
    },
  }),
)
```

### Custom CDN

You can use a custom CDN ，default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    spec: {
      content: OpenApiSpecification,
    },
  }),
)
```
