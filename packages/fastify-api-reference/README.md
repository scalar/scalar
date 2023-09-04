# Scalar Fastify API Reference Plugin

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Fastify.

## Installation

```bash
npm install @scalar/fastify-api-reference
```

## Usage

```ts
import fastifyApiReference from '@scalar/fastify-api-reference'

// Serve a Swagger file (optional)
fastify.get('/swagger.json', async (request, reply) => {
  reply.send(await import('./swagger.json'))
})

// Render an API reference for a given OpenAPI/Swagger spec URL
fastify.register(fastifyApiReference, {
  prefix: '/api-reference',
  apiReference: {
    title: 'Our API Reference',
    specUrl: '/swagger.json',
  },
})
```
