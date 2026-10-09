import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import type { OpenApiRenderOptions } from './select-document'

const error = { $ref: '#/components/schemas/Error' }
const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: { 'application/json': { schema: error } },
})

const document = {
  openapi: '3.1.1',
  info: { title: 'Tunnels', version: '1' },
  paths: {
    '/tunnels': {
      get: {
        summary: 'List tunnels',
        parameters: [
          { name: 'limit', in: 'query', description: 'Page size.', schema: { type: 'integer', format: 'int32' } },
          { name: 'tunnel_id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'x-trace', in: 'header', schema: { type: 'string', description: 'Trace the request.' } },
        ],
        responses: {
          '200': {
            description: 'Tunnels',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
          },
          '400': errorResponse('Invalid argument'),
          '401': errorResponse('Unauthenticated'),
          '429': {
            ...errorResponse('Rate limited'),
            headers: { 'retry-after': { schema: { type: 'integer' } } },
          },
          '500': errorResponse('Internal error'),
          '503': { description: 'Unavailable', content: { 'text/plain': { schema: error } } },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
    },
  },
}

const page = async (options: OpenApiRenderOptions = { operation: { path: '/tunnels', method: 'get' } }) =>
  await createMarkdownFromOpenApi(document, options)

describe('render-operation', () => {
  it.each(['3.0.4', '3.1.2', '3.2.1'])('retains empty server overrides on selected pages in %s', async (openapi) => {
    const input = {
      openapi,
      info: { title: 'Servers', version: '1' },
      servers: [{ url: 'https://global.example.com' }],
      paths: { '/items': { get: { servers: [], responses: {} } } },
      webhooks: { changed: { post: { servers: [], responses: {} } } },
    }
    const operation = await createMarkdownFromOpenApi(input, { operation: { path: '/items', method: 'get' } })
    expect(operation).toContain('## Effective servers\n\n- `/`\n')
    expect(operation).not.toContain('https://global.example.com')
    if (openapi !== '3.0.4') {
      const webhook = await createMarkdownFromOpenApi(input, { webhook: { name: 'changed', method: 'post' } })
      expect(webhook).toContain('## Effective servers\n\n- `/`\n')
      expect(webhook).not.toContain('https://global.example.com')
    }
  })

  it('retains server variable choices and descriptions on a selected page', async () => {
    const markdown = await createMarkdownFromOpenApi(
      {
        openapi: '3.1.2',
        info: { title: 'Servers', version: '1' },
        servers: [
          {
            url: 'https://{region}.example.com',
            variables: { region: { default: 'us', enum: ['us', 'eu'], description: 'Choose a **region**.' } },
          },
        ],
        paths: { '/items': { get: { responses: {} } } },
      },
      { operation: { path: '/items', method: 'get' } },
    )
    expect(markdown).toContain('region: `us`, possible values: `us, eu`')
    expect(markdown).toContain('Choose a **region**.')
  })

  it('starts a single operation page with the operation and uses second-level sections', async () => {
    const markdown = await page()
    expect(markdown.startsWith('# List tunnels\n')).toBe(true)
    expect(markdown).not.toContain('# Tunnels')
    expect(markdown).not.toContain('OpenAPI Version')
    expect(markdown).not.toContain('## Operations')
    for (const heading of ['## Path parameters', '## Query parameters', '## Header parameters', '## Responses'])
      expect(markdown).toContain(`\n${heading}\n`)
  })

  it('keeps document-level headings when rendering the whole document', async () => {
    const markdown = await page({})
    expect(markdown).toContain('# Tunnels\n')
    expect(markdown).toContain('## Operations\n\n<a id="scalar-operation-get-tunnels"></a>\n\n### List tunnels\n')
    expect(markdown).toContain('\n#### Responses\n')
  })

  it('lists parameters by location with their type on one line', async () => {
    const markdown = await page()
    expect(markdown).toContain('## Path parameters\n\n- **`tunnel_id` (required)**: `string`\n')
    expect(markdown).toContain('## Query parameters\n\n- **`limit`**: `integer`, format: `int32`\n\n  Page size.\n')
    // A description on the parameter schema is kept when the parameter has none.
    expect(markdown).toContain('- **`x-trace`**: `string`\n\n  Trace the request.\n')
  })

  it('does not repeat a parameter description that its schema repeats', async () => {
    const markdown = await createMarkdownFromOpenApi(
      {
        openapi: '3.1.1',
        info: { title: 'API', version: '1' },
        paths: {
          '/items': {
            get: {
              parameters: [
                { name: 'q', in: 'query', description: 'Search.', schema: { type: 'string', description: 'Search.' } },
              ],
              responses: {},
            },
          },
        },
      },
      { operation: { path: '/items', method: 'get' } },
    )
    expect(markdown.match(/Search\./g)).toHaveLength(1)
  })

  it('groups responses that share a schema and media type into one entry', async () => {
    const markdown = await page()
    expect(markdown).toContain(
      '### 400, 401, 500\n\n- `400` Invalid argument\n- `401` Unauthenticated\n- `500` Internal error\n\n**Content type:** `application/json`\n',
    )
    // The shared schema is described once.
    expect(markdown.match(/`message` \(required\)/g)).toHaveLength(1)
    // Response headers and a different media type keep their own entries.
    expect(markdown).toContain('### 429 Rate limited\n')
    expect(markdown).toContain('### 503 Unavailable\n')
    expect(markdown).toContain('### 200 Tunnels\n\n**Content type:** `application/json`\n\n`array of string`\n')
  })

  it('groups responses in linked mode as well', async () => {
    const markdown = await page({
      operation: { path: '/tunnels', method: 'get' },
      schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${name}` },
    })
    expect(markdown).toContain('### 400, 401, 500\n')
    expect(markdown).toContain('schema: [Error](/models/Error)')
  })
})
