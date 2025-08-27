import fastifySwagger from '@fastify/swagger'
import Fastify from 'fastify'

// Init Fastify
const fastify = Fastify({
  logger: true,
  // ignoreTrailingSlash: true,
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
          name: 'X-Api-Key',
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
      tags: ['Authentication'],
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
            greeting: { type: 'string', examples: ['Hello Marc'] },
          },
        },
      },
    },
  },
  (req, reply) => {
    reply.code(201).send({ greeting: `Hello ${req.body.name}` })
  },
)

// Add a POST route
fastify.post<{ Body: { username: string; email: string } }>(
  '/register',
  {
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      summary: 'Creates a new user account',
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', examples: ['marc'] },
          email: {
            type: 'string',
            format: 'email',
            examples: ['marc@scalar.com'],
          },
        },
        required: ['username', 'email'],
      },
      response: {
        201: {
          description: 'User created successfully',
          type: 'object',
          properties: {
            userId: { type: 'string', examples: ['12345'] },
          },
        },
      },
    },
  },
  (_, reply) => {
    // Simulate user creation
    const userId = '12345' // This would be generated dynamically
    reply.code(201).send({ userId })
  },
)

// Add a GET route
fastify.get<{ Querystring: { userId: string } }>(
  '/user',
  {
    schema: {
      description: 'Get user details',
      tags: ['Authentication'],
      summary: 'Fetches details of a user by ID',
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string', examples: ['12345'] },
        },
        required: ['userId'],
      },
      response: {
        200: {
          description: 'User details retrieved successfully',
          type: 'object',
          properties: {
            username: { type: 'string', examples: ['marc'] },
            email: { type: 'string', examples: ['marc@scalar.com'] },
          },
        },
      },
    },
  },
  (_, reply) => {
    // Simulate fetching user details
    const user = { username: 'marc', email: 'marc@scalar.com' }
    reply.code(200).send(user)
  },
)

// Add a DELETE route
fastify.delete<{ Querystring: { userId: string } }>(
  '/user',
  {
    schema: {
      description: 'Delete a user',
      tags: ['Authentication'],
      summary: 'Deletes a user by ID',
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string', examples: ['12345'] },
        },
        required: ['userId'],
      },
      response: {
        204: {
          description: 'User deleted successfully',
          type: 'null',
        },
      },
    },
  },
  (_, reply) => {
    // Simulate user deletion
    reply.code(204).send()
  },
)

// Add the plugin
await fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/',
})

const PORT = Number(process.env.PORT) || 5053
const HOST = process.env.HOST || '0.0.0.0'

// Start the server
fastify.listen({ port: PORT, host: HOST }, (_, address) => {
  console.log(`⚡️ Fastify Plugin running on ${address}`)
})
