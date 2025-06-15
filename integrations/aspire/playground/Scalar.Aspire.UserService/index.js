import fastifySwagger from '@fastify/swagger'
import Fastify from 'fastify'

const port = process.env.PORT || 3000

const app = Fastify({
  logger: true,
})

await app.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      description: 'A simple API to manage users',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
    tags: [{ name: 'users', description: 'User related operations' }],
  },
})

// Schema definitions for reuse
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email'],
}

const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
}

// Get all users
app.get(
  '/api/users',
  {
    schema: {
      tags: ['users'],
      summary: 'Get all users',
      description: 'Retrieve a list of all users',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
        },
      },
      response: {
        200: {
          description: 'Successfully retrieved users',
          type: 'array',
          items: userSchema,
        },
        500: {
          description: 'Internal server error',
          ...errorSchema,
        },
      },
    },
  },
  async (request) => {
    const { limit = 10 } = request.query

    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: '2025-01-01T00:00:00Z' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: '2025-01-02T00:00:00Z' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', createdAt: '2025-01-03T00:00:00Z' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', createdAt: '2025-01-04T00:00:00Z' },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', createdAt: '2025-01-05T00:00:00Z' },
      { id: 6, name: 'Diana Davis', email: 'diana@example.com', createdAt: '2025-01-06T00:00:00Z' },
      { id: 7, name: 'Edward Miller', email: 'edward@example.com', createdAt: '2025-01-07T00:00:00Z' },
      { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', createdAt: '2025-01-08T00:00:00Z' },
      { id: 9, name: 'George Martinez', email: 'george@example.com', createdAt: '2025-01-09T00:00:00Z' },
      { id: 10, name: 'Helen Rodriguez', email: 'helen@example.com', createdAt: '2025-01-10T00:00:00Z' },
    ]

    return users.slice(0, limit)
  },
)

// OpenAPI JSON endpoint
app.get(
  '/openapi/external.json',
  {
    schema: {
      hide: true,
    },
  },
  async (_request, reply) => {
    reply.type('application/json')
    return app.swagger()
  },
)

// Start the server
const start = () => {
  try {
    app.listen({ port: port })
    console.log(`📋 OpenAPI JSON: http://localhost:${port}/openapi.json`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
