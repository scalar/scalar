# Scalar for Fastify

[![Version](https://img.shields.io/npm/v/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Ffastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The easiest way to render a beautiful API reference with Fastify. All based on your OpenAPI/Swagger document.

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

## Installation

```bash
npm install @scalar/fastify-api-reference
```

And then register it with Fastify:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

## Usage

If you have a OpenAPI/Swagger document already, you can pass an URL to the plugin:

```ts
// Render an API reference for a given OpenAPI/Swagger spec URL
fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    title: 'Our API Reference',
    spec: {
      url: '/openapi.json',
    },
  },
})
```

With [@fastify/swagger], we’re picking it up automatically, so this would be enough:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

We wrote a [detailed integration guide for Fastify](https://github.com/scalar/scalar/tree/main/documentation/integrations/fastify.md).

The fastify plugin takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/documentation/configuration.md) in the core package README.

## Themes

By default, we’re using a custom Fastify theme and it’s beautiful. But you can choose [one of our other themes](https://github.com/scalar/scalar/tree/main/packages/themes), too:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    theme: 'purple',
  },
})
```

## Logging

The plugin is compatible with the Fastify logger. You can configure the log level for the routes registered by the plugin:

```ts
fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  logLevel: 'silent',
})
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
