# Scalar Fastify API Reference Plugin

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Fastify.

## Installation

```bash
npm install @scalar/fastify-api-reference
```

## Usage

If you have a OpenAPI/Swagger file already, you can pass an URL to the plugin:

```ts
// Render an API reference for a given OpenAPI/Swagger spec URL
fastify.register(require('@scalar/fastify-api-reference'), {
  prefix: '/api-reference',
  apiReference: {
    title: 'Our API Reference',
    specUrl: '/swagger.json',
  },
})
```

With the [@fastify/swagger](https://github.com/fastify/fastify-swagger) you can even generate your Swagger spec from the registered routes and directly pass it to the plugin:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  prefix: '/api-reference',
  apiReference: {
    spec: fastify.swagger(),
  },
})
```
