// import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'

// Init Fastify
const fastify = Fastify({
  logger: false,
})

// Register Swagger
await fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Example API',
    },
  },
})

// Add some routes
fastify.put(
  '/example-route/:id',
  {
    schema: {
      description: 'post some data',
      tags: ['user', 'code'],
      summary: 'qwerty',
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'user id',
          },
        },
      },
      body: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
          obj: {
            type: 'object',
            properties: {
              some: { type: 'string' },
            },
          },
        },
      },
      response: {
        201: {
          description: 'Successful response',
          type: 'object',
          properties: {
            hello: { type: 'string' },
          },
        },
      },
    },
  },
  (req, reply) => {},
)

// Add the plugin
await fastify.register(require('@scalar/fastify-api-reference'), {
  prefix: '/api-reference',
  apiReference: {
    // Pass the generated Swagger spec:
    // @ts-ignore
    spec: fastify.swagger(),
    // Or pass the URL to the spec:
    // specUrl: '/scalar.json',
  },
})

// Start the server
fastify.listen({ port: 64100 }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/api-reference`)
})
