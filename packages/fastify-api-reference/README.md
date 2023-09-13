# Scalar Fastify API Reference Plugin

![Version](https://img.shields.io/npm/v/%40scalar/fastify-api-reference)
![Downloads](https://img.shields.io/npm/dm/%40scalar/fastify-api-reference)
![License](https://img.shields.io/npm/l/%40scalar%2Ffastify-api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

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
