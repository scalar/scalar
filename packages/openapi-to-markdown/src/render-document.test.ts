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
      '## Operations\n\n<a id="scalar-operation-get-a"></a>\n\n### Shared operation\n\n- **Method:** `GET`\n- **Path:** `/a`\n\n#### Responses\n\n##### 200 Success\n\n## Webhooks\n\n<a id="scalar-webhook-post-event"></a>\n\n### Webhook override\n\n- **Method:** `POST`\n- **Webhook:** `event`\n\n#### Responses\n\n##### 200 Success\n',
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
    expect(output.replaceAll('`', '')).toContain('Request body')
    expect(output.replaceAll('`', '')).toContain('filter')
    expect(output.replaceAll('`', '')).toContain('Responses')
    expect(output.replaceAll('`', '')).toContain('200')
    expect(output.replaceAll('`', '')).toContain('array of string')
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

    expect(text).toContain('## Path parameters\n\n- **reportId (required)**: string')
    expect(text).toContain('Report identifier')
    expect(text).toContain('## Query parameters\n\n- **month (required)**: string')
    expect(text).toContain('Calendar month')
    expect(text).toContain('## Header parameters\n\n- **traceId**: string')
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

  const ref = (name: string): { $ref: string } => ({ $ref: `#/components/schemas/${name}` })
  const page = {
    openapi: '3.1.1',
    info: { title: 'Appendix', version: '1' },
    paths: {
      '/owner': {
        get: {
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: ref('Resource') } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Resource: {
          type: 'object',
          title: 'Resource record',
          description: 'A resource.',
          properties: { owner: { ...ref('Owner'), description: 'Who owns it' }, secondary: ref('Alias') },
        },
        Owner: { type: 'object', description: 'An account.', properties: { id: { type: 'integer' } } },
        Alias: ref('Owner'),
        Sample: {
          type: 'object',
          example: { id: 7 },
          properties: { nested: ref('Owner') },
        },
        Status: { type: 'string', enum: ['open', 'closed'] },
        Unused: { type: 'object', properties: { unusedField: { type: 'string' } } },
      },
    },
  }

  it('lists models the page already expanded on one line each', async () => {
    const output = await createMarkdownFromOpenApi(page, { operation: { path: '/owner', method: 'get' } })
    const appendix = output.slice(output.indexOf('## Schemas'))
    expect(appendix).toBe(
      [
        '## Schemas',
        '',
        '- **Resource record** (`Resource`) — shown above.',
        '- `Owner` — shown above.',
        '',
        // A reference sibling replaced this description where the schema was expanded.
        '  An account.',
        '- `Alias` — shown above as `Owner`.',
        '',
        '  An account.',
        '',
      ].join('\n'),
    )
    // The body expands each shared schema once, so nothing is lost from the page.
    expect(output.match(/`id`/g)?.length).toBe(1)
    expect(output).toContain('Who owns it')
    expect(output).not.toContain('unusedField')
  })

  it('keeps canonical model sections and authored examples in a whole document', async () => {
    const output = await createMarkdownFromOpenApi(page)
    const appendix = output.slice(output.indexOf('## Schemas'))
    expect(appendix).toContain('### Resource record')
    expect(appendix).toContain('### Sample')
    expect(appendix).toContain('"id": 7')
    // Leaf schemas are never replaced by a reference, so they keep their section.
    expect(appendix).toContain('### Status')
    expect(appendix).toContain('### Unused')
    expect(appendix).toContain('unusedField')
    expect(appendix).toContain('### Owner')
  })

  it('gives a selected model its own section even when a dependency expanded it first', async () => {
    const output = await createMarkdownFromOpenApi(page, { model: 'Alias' })
    // The model page starts with its own model, which expands the schema it aliases.
    expect(output.startsWith('# Alias\n')).toBe(true)
    expect(output).toContain('`id`')
    expect(output).not.toContain('`Alias` — shown above')
  })

  it.each(['inline', 'linked'] as const)('retains authored examples for non-object models in %s mode', async (mode) => {
    const input = {
      openapi: '3.1.2',
      info: { title: 'Examples', version: '1' },
      components: {
        schemas: {
          Name: { type: 'string', example: 'authored name' },
          Names: { type: 'array', items: { type: 'string' }, examples: [['authored item']] },
        },
      },
    }
    const schemaReferences = mode === 'linked' ? { mode } : undefined
    const name = await createMarkdownFromOpenApi(input, { model: 'Name', schemaReferences })
    expect(name).toContain('**Example:**\n\n```json\n"authored name"\n```')
    const names = await createMarkdownFromOpenApi(input, { model: 'Names', schemaReferences })
    expect(names).toContain('**Example:**\n\n```json\n[\n  "authored item"\n]\n```')
    const whole = await createMarkdownFromOpenApi(input, { schemaReferences })
    expect(whole).toContain('"authored name"')
    expect(whole).toContain('"authored item"')
  })

  it('separates content after a nested list so it does not continue the list', async () => {
    const output = await createMarkdownFromOpenApi(
      {
        openapi: '3.1.1',
        info: { title: 'Lists', version: '1' },
        components: {
          schemas: {
            Pet: {
              type: 'object',
              properties: {
                kind: {
                  oneOf: [
                    { type: 'object', properties: { bark: { type: 'string' } } },
                    { type: 'object', properties: { meow: { type: 'string' } } },
                  ],
                  discriminator: { propertyName: 'type', mapping: { dog: '#/components/schemas/Dog' } },
                },
              },
            },
          },
        },
      },
      { model: 'Pet' },
    )
    expect(output).toContain(
      '  **One of:** discriminated by `type`\n  - `object`\n    - **`bark`**: `string`\n  - `object`\n    - **`meow`**: `string`\n\n  **Discriminator:** `type`\n',
    )
  })
})
