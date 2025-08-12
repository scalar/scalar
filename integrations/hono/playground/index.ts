import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'
import { cors } from 'hono/cors'
import { Scalar } from '../src/index'

const PORT = Number(process.env.PORT) || 5054
const HOST = process.env.HOST || '0.0.0.0'

const app = new OpenAPIHono()

// Example route
app.openapi(
  createRoute({
    method: 'get',
    path: '/hello-world',
    description: 'Respond a message',
    tags: ['basic example'],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  (c): Response => {
    return c.json({
      message: 'hello',
    })
  },
)

app.openapi(
  createRoute({
    name: 'Get all posts',
    method: 'get',
    path: '/posts',
    description: 'Returns all posts',
    tags: ['posts'],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              posts: z.array(
                z.object({
                  id: z.number().default(123),
                  title: z.string(),
                  body: z.string(),
                }),
              ),
            }),
          },
        },
      },
    },
  }),
  (c): Response => {
    return c.json({
      posts: [
        {
          id: 123,
          title: 'My Blog Post',
          body: 'I want to share something with you …',
        },
      ],
    })
  },
)

app.openapi(
  createRoute({
    name: 'Create post',
    method: 'post',
    path: '/posts',
    description: 'Create a new post',
    tags: ['posts'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              title: z.string().default('My Blog Post'),
              body: z.string().default('I want to share something with you …'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              id: z.number().default(123),
              title: z.string().default('My Blog Post'),
              body: z.string().default('I want to share something with you …'),
            }),
          },
        },
      },
    },
  }),
  (c): Response => {
    return c.json({
      id: 123,
      title: 'My Blog Post',
      body: 'I want to share something with you …',
    })
  },
)

app.openapi(
  createRoute({
    name: 'Delete Post',
    method: 'delete',
    path: '/posts/{id}',
    description: 'Delete a post',
    tags: ['posts'],
    request: {
      params: z.object({
        id: z.number().default(123),
      }),
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string().default('OK'),
              message: z.string().default('Post deleted'),
            }),
          },
        },
      },
      404: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string().default('ERROR'),
              message: z.string().default('Post not found'),
            }),
          },
        },
      },
    },
  }),
  (c): Response => {
    return c.json({
      status: 'OK',
      message: 'Post deleted',
    })
  },
)

// Create an OpenAPI endpoint
app.use('/doc', cors())
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Example',
    description:
      'The `@scalar/hono-api-reference` middleware renders a beautiful API reference based on your OpenAPI specification.',
    version: 'v1',
  },
})

// Load the middleware
app.get(
  '/',
  Scalar({
    onLoaded: () => {
      console.log('ready')
    },
    sources: [
      {
        title: 'Hono',
        url: '/doc',
      },
      {
        title: 'Scalar Galaxy',
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      },
    ],
    pageTitle: 'Hono API Reference Demo',
  }),
)

// Markdown for LLMs
const content = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'Example', version: 'v1' },
})

const markdown = await createMarkdownFromOpenApi(JSON.stringify(content))

app.get('/llms.txt', async (c) => {
  return c.text(markdown)
})

// Listen
serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (address) => {
    console.log(`🔥 Hono Middleware listening on http://${HOST}:${address.port}/`)
  },
)
