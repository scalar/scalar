# Scalar Fastify API Reference Plugin

[![Version](https://img.shields.io/npm/v/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/fastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Ffastify-api-reference)](https://www.npmjs.com/package/@scalar/fastify-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Fastify.

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

If you have a OpenAPI/Swagger file already, you can pass an URL to the plugin:

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

With the [@fastify/swagger](https://github.com/fastify/fastify-swagger) you can even generate your Swagger spec from the registered routes and directly pass it to the plugin:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    spec: {
      content: () => fastify.swagger(),
    },
  },
})
```

Actually, we’re picking it up automatically, so this would be enough:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

Or, if you just have a static OpenAPI spec, you can directly pass it, too:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    spec: {
      content: { … }
    },
  },
})
```

The fastify plugin takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/packages/api-reference#configuration) in the core package README.

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
