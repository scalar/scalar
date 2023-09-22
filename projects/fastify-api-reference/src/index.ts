import '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'

// Init Fastify
const fastify = Fastify({
  logger: false,
})

// Register Swagger
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  () => {},
)

// Add the plugin
await fastify.register(fastifyApiReference, {
  routePrefix: '/reference',
  // Pass the generated Swagger spec:
  apiReference: {
    spec: () => fastify.swagger(),
    // Or pass the URL to the spec:
    // specUrl: '/scalar.json',
  },
})

// Start the server
fastify.listen({ port: 5053 }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/reference`)
})
