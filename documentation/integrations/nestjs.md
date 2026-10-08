# API Reference for NestJS

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger file with NestJS.

## Installation

```bash
npm install @scalar/nestjs-api-reference
```

## Usage

[Set up NestJS](https://docs.nestjs.com/first-steps) and [set up NestJS Swagger](https://docs.nestjs.com/openapi/introduction) and pass an OpenAPI/Swagger document to the `apiReference` middleware:

```typescript
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

Recommended: If you're serving an OpenAPI/Swagger file already, you can pass a URL, too:

```typescript
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

```typescript
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

### Custom plugins

NestJS runs on the server, but plugins run in the browser. Passing a plugin through
`plugins` writes its function source into the page. Imported components, renderers,
and other values captured from your server module are not carried over.

Use `pluginUrls` to load a browser ESM module instead. This option is available in
the standalone API Reference build from version 1.64.0. If you pin `cdn` to an older
version, update that version too.

For example, save this as `public/plugins/custom-extension.js`:

```javascript
const prefix = 'Custom extension: '

const CustomExtension = (props) => `${prefix}${props.xCustomExtension}`
CustomExtension.props = ['xCustomExtension']

export default () => ({
  name: 'custom-extension',
  extensions: [{ name: 'x-custom-extension', component: CustomExtension }],
})
```

This module needs no build step or framework imports. Its default export is the
plugin function, not a factory that returns another plugin function.

With the Express adapter, serve the `public` directory and pass the module URL:

```typescript
import { join } from 'node:path'

import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { apiReference } from '@scalar/nestjs-api-reference'

import { AppModule } from './app.module'

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useStaticAssets(join(process.cwd(), 'public'))

  app.use(
    '/reference',
    apiReference({
      content: {
        openapi: '3.1.0',
        info: { title: 'Plugin example', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              'summary': 'Hello',
              'x-custom-extension': 'Rendered in the browser',
              'responses': { '200': { description: 'OK' } },
            },
          },
        },
      },
      pluginUrls: ['/plugins/custom-extension.js'],
    }),
  )

  await app.listen(3000)
}

void bootstrap()
```

Open `/reference` to see `Custom extension: Rendered in the browser` beneath the
operation. Ensure your deployment includes the `public` directory.

With the Fastify adapter, install `@fastify/static`, serve the same directory with
`app.useStaticAssets({ root: join(process.cwd(), 'public') })`, and set
`withFastify: true` in `apiReference` as described above.

For plugins with imports or JSX, build a browser ESM entry that default-exports
`MyCustomPlugin()` and serve its output and any chunks it imports. The browser must
be able to resolve every dependency; a compiled NestJS CommonJS module is not a
browser plugin. Framework components and renderers also need a compatible browser
runtime. This example uses a plain functional component and does not demonstrate
React renderer setup.

Only load plugin URLs you trust. Cross-origin modules need CORS headers, and your
Content Security Policy must allow the module URLs. Modules load before the API
reference mounts; failed imports are logged and skipped so the reference can still
render. See the [plugin guide](../plugins.md#loading-a-plugin-from-a-url) for more.

### Themes

The middleware comes with a custom theme for NestJS. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```typescript
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

You can use a custom CDN, default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```typescript
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
    content: OpenApiSpecification,
  }),
)
```
