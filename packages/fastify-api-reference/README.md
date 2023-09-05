# Scalar Fastify API Reference Plugin

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Fastify.

## Installation

```bash
npm install @scalar/fastify-api-reference
```

## Usage

If you have a OpenAPI/Swagger file somewhere, you can pass an URL to the plugin:

```ts
// Serve a Swagger file (optional)
fastify.get('/swagger.json', async (request, reply) => {
  reply.send(await import('./swagger.json'))
})

// Render an API reference for a given OpenAPI/Swagger spec URL
fastify.register(require('@scalar/fastify-api-reference'), {
  prefix: '/api-reference',
  apiReference: {
    title: 'Our API Reference',
    specUrl: '/swagger.json',
  },
})
```

With the @fastify/swagger you can even generate your Swagger file on the fly:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  prefix: '/api-reference',
  apiReference: {
    spec: fastify.swagger(),
  },
})
```
