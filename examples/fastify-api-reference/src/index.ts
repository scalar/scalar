import fastifySwagger from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'

// Init Fastify
const fastify = Fastify({
  logger: false,
})

// Register Swagger
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'My Fastify App',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header',
        },
      },
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
  // configuration: {
  // theme: 'moon',
  // spec: {
  // content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
  // content: () => fastify.swagger(),
  // url: '/scalar.json',
  // },
  // customCss: `body { border: 10px solid red; }`,
  // },
})

const PORT = Number(process.env.PORT) || 5053
const HOST = process.env.HOST || '0.0.0.0'

// Start the server
fastify.listen({ port: PORT, host: HOST }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/reference`)
})
