import { createServer } from 'node:http'
import { URL } from 'node:url'

const port = process.env.PORT || 3000

// Static OpenAPI document
const openApiDocument = {
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
  paths: {
    '/api/users': {
      get: {
        tags: ['users'],
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 5,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successfully retrieved users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'name', 'email'],
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)

  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET' && url.pathname === '/openapi/external.json') {
    res.writeHead(200)
    res.end(JSON.stringify(openApiDocument, null, 2))
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/users') {
    const limit = Number.parseInt(url.searchParams.get('limit')) || 10
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
    res.writeHead(200)
    res.end(JSON.stringify(users.slice(0, limit), null, 2))
    return
  }

  // 404 for all other routes
  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(port, () => {
  console.log(`📋 OpenAPI JSON: http://localhost:${port}/openapi/external.json`)
  console.log(`🚀 Server running on http://localhost:${port}`)
})
