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
fastify.put<{ Body: { name: string } }>(
  '/hello',
  {
    schema: {
      description: 'Greet a user',
      tags: ['user'],
      summary: 'Replies with a nice greeting',
      body: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            examples: ['Marc'],
          },
        },
        required: ['name'],
      },
      response: {
        201: {
          description: 'Successful response',
          type: 'object',
          properties: {
            greeting: { type: 'string' },
          },
        },
      },
    },
  },
  (req, reply) => {
    reply.code(201).send({ greeting: `Hello ${req.body.name}` })
  },
)

// Add the plugin
await fastify.register(fastifyApiReference, {
  routePrefix: '/reference',
})

const PORT = Number(process.env.PORT) || 5053
const HOST = process.env.HOST || '0.0.0.0'

// Start the server
fastify.listen({ port: PORT, host: HOST }, function (_, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/reference`)
})
