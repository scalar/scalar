import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import { createDocumentRenderer } from './render-document'

describe('render-document', () => {
  it('renders referenced operations and their sibling overrides in paths and webhooks', async () => {
    const output = await createMarkdownFromOpenApi({
      openapi: '3.1.1',
      info: { title: 'References', version: '1.0.0' },
      paths: { '/a': { get: { $ref: '#/x-operation' } } },
      webhooks: { event: { post: { $ref: '#/x-operation', summary: 'Webhook override' } } },
      'x-operation': { summary: 'Shared operation', responses: { '200': { description: 'Success' } } },
    })
    expect(output.slice(output.indexOf('## Operations'))).toBe(
      '## Operations\n\n### Shared operation\n\n- **Method:** `GET`\n- **Path:** `/a`\n\n#### Responses\n\n##### Status: 200 Success\n\n## Webhooks\n\n### Webhook override\n\n- **Method:** `POST`\n- **Webhook:** `event`\n\n#### Responses\n\n##### Status: 200 Success\n',
    )
  })

  const withMeta = (document: Omit<OpenApiDocument, 'x-scalar-original-document-hash'>): OpenApiDocument => ({
    ...document,
    'x-scalar-original-document-hash': 'test-hash',
  })

  it('renders basic API information', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
      },
      paths: {},
    })

    const output = await createDocumentRenderer()(content)

    expect(output.replaceAll('`', '')).toContain('Test API')
    expect(output.replaceAll('`', '')).toContain('OpenAPI Version:')
    expect(output.replaceAll('`', '')).toContain('3.1.1')
    expect(output.replaceAll('`', '')).toContain('API Version:')
    expect(output.replaceAll('`', '')).toContain('1.0.0')
    expect(output.replaceAll('`', '')).toContain('Test description')
  })

  it('renders servers section with variables', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [
        {
          url: 'https://test.com',
          description: 'Test server',
        },
        {
          url: 'https://test.com/{version}',
          description: 'Test server v2',
          variables: {
            version: {
              default: 'v2',
              description: 'Test version',
            },
          },
        },
      ],
      paths: {},
    })

    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).toContain('Servers')
    expect(output.replaceAll('`', '')).toContain('https://test.com')
    expect(output.replaceAll('`', '')).toContain('Test server')
    expect(output.replaceAll('`', '')).toContain('https://test.com/{version}')
    expect(output.replaceAll('`', '')).toContain('Test server v2')
    expect(output.replaceAll('`', '')).toContain('version')
    expect(output.replaceAll('`', '')).toContain('v2')
    expect(output.replaceAll('`', '')).toContain('Test version')
  })

  it('renders operations section with summary, tags, stability, and request/response', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            description: 'Get all users',
            tags: ['users'],
            'x-scalar-stability': 'stable',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { filter: { type: 'string' } },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).toContain('Operations')
    expect(output.replaceAll('`', '')).toContain('Get users')
    expect(output.replaceAll('`', '')).toContain('GET')
    expect(output.replaceAll('`', '')).toContain('/users')
    expect(output.replaceAll('`', '')).toContain('users')
    expect(output.replaceAll('`', '')).toContain('stable')
    expect(output.replaceAll('`', '')).toContain('Get all users')
    expect(output.replaceAll('`', '')).toContain('Request Body')
    expect(output.replaceAll('`', '')).toContain('filter')
    expect(output.replaceAll('`', '')).toContain('Responses')
    expect(output.replaceAll('`', '')).toContain('200')
    expect(output.replaceAll('`', '')).toContain('Array of:')
    expect(output.replaceAll('`', '')).toContain('string')
  })

  it('renders path and operation parameters', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/reports/{reportId}': {
          parameters: [
            {
              name: 'reportId',
              in: 'path',
              required: true,
              description: 'Report identifier',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'traceId',
              in: 'header',
              description: 'Path trace identifier',
              schema: {
                type: 'string',
              },
            },
          ],
          get: {
            summary: 'Get report',
            parameters: [
              {
                name: 'month',
                in: 'query',
                required: true,
                description: 'Calendar month',
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'traceId',
                in: 'header',
                description: 'Operation trace identifier',
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
    })

    const output = await createDocumentRenderer()(content)
    const text = output.replaceAll('`', '')

    expect(text).toContain('Parameters')
    expect(text).toContain('reportId required')
    expect(text).toContain('path')
    expect(text).toContain('Report identifier')
    expect(text).toContain('month required')
    expect(text).toContain('query')
    expect(text).toContain('Calendar month')
    expect(text).toContain('traceId')
    expect(text).toContain('header')
    expect(text).toContain('Operation trace identifier')
    expect(text).not.toContain('Path trace identifier')
  })

  it('renders deprecated operation', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/deprecated': {
          post: {
            deprecated: true,
            description: 'Deprecated operation',
          },
        },
      },
    })
    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).toContain('Deprecated')
    expect(output.replaceAll('`', '')).toContain('Deprecated operation')
  })

  it('does not treat connect as an operation method', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/tunnel': {
          connect: {
            summary: 'Should not render',
            description: 'Not a valid OpenAPI operation method',
            responses: {
              default: {
                description: 'ok',
              },
            },
          },
        },
      },
    })

    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).not.toContain('Should not render')
    expect(output.replaceAll('`', '')).not.toContain('CONNECT')
    expect(output.replaceAll('`', '')).not.toContain('/tunnel')
  })

  it('renders webhooks section', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      webhooks: {
        newUser: {
          post: {
            summary: 'New user webhook',
            description: 'Triggered when a new user is created',
            tags: ['webhook'],
          },
        },
      },
      paths: {},
    })
    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).toContain('Webhooks')
    expect(output.replaceAll('`', '')).toContain('New user webhook')
    expect(output.replaceAll('`', '')).toContain('newUser')
    expect(output.replaceAll('`', '')).toContain('webhook')
    expect(output.replaceAll('`', '')).toContain('Triggered when a new user is created')
  })

  it('renders schemas section', async () => {
    const content: OpenApiDocument = withMeta({
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            title: 'User',
            description: 'A user object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
      paths: {},
    })
    const output = await createDocumentRenderer()(content)
    expect(output.replaceAll('`', '')).toContain('Schemas')
    expect(output.replaceAll('`', '')).toContain('User')
    expect(output.replaceAll('`', '')).toContain('A user object')
    expect(output.replaceAll('`', '')).toContain('id')
    expect(output.replaceAll('`', '')).toContain('name')
  })
})
