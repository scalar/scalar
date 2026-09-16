import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './browser'

const loadDocument = async (): Promise<OpenApiDocument> => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'example',
    document: {
      openapi: '3.1.1',
      info: { title: 'Example API', version: '1' },
      servers: [{ url: 'https://api.example.com' }],
      security: [{ apiKey: [] }],
      paths: {
        '/pets': {
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
          get: {
            summary: 'List pets',
            responses: {
              '200': {
                description: 'Found pets',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
              },
            },
          },
          post: { summary: 'Create a pet', responses: { '201': { description: 'Created' } } },
        },
      },
      webhooks: {
        petCreated: { post: { summary: 'Pet created event', responses: { '200': { description: 'Received' } } } },
      },
      components: {
        schemas: {
          Pet: { type: 'object', properties: { petName: { type: 'string' } } },
          Unrelated: { type: 'object', properties: { unrelatedProperty: { type: 'string' } } },
        },
        securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' } },
      },
    },
  })
  const document = store.workspace.documents.example
  if (!isOpenApiDocument(document)) {
    throw new Error('Expected an OpenAPI document')
  }
  return document
}

describe('browser', () => {
  it('copies one resolved operation with its parameters, schemas, server and security', async () => {
    const document = await loadDocument()
    const before = JSON.stringify(document)
    const markdown = await createMarkdownFromOpenApi(document, { operation: { path: '/pets', method: 'get' } })

    expect(markdown).toContain('### List pets')
    expect(markdown).toContain('limit')
    expect(markdown).toContain('petName')
    expect(markdown).toContain('https://api.example.com')
    expect(markdown).toContain('X-API-Key')
    expect(markdown).not.toContain('Create a pet')
    expect(markdown).not.toContain('Pet created event')
    expect(markdown).not.toContain('unrelatedProperty')
    expect(JSON.stringify(document)).toBe(before)
  })

  it('copies a selected webhook without unrelated operations', async () => {
    const markdown = await createMarkdownFromOpenApi(await loadDocument(), {
      webhook: { name: 'petCreated', method: 'post' },
    })
    expect(markdown).toContain('Pet created event')
    expect(markdown).not.toContain('List pets')
  })

  it('rejects a missing operation', async () => {
    await expect(
      createMarkdownFromOpenApi(await loadDocument(), { operation: { path: '/missing', method: 'get' } }),
    ).rejects.toThrow('Operation not found')
  })
  it('copies QUERY operations and excludes them when selecting a different method', async () => {
    const document = await loadDocument()
    document.openapi = '3.2.0'
    const pathItem = getResolvedPathItem(document.paths?.['/pets'])
    if (!pathItem) {
      throw new Error('Expected a path item')
    }
    pathItem.query = {
      summary: 'Search pets',
      responses: { '200': { description: 'Search results' } },
    }
    const query = await createMarkdownFromOpenApi(document, { operation: { path: '/pets', method: 'query' } })
    const get = await createMarkdownFromOpenApi(document, { operation: { path: '/pets', method: 'get' } })
    expect(query).toContain('### Search pets')
    expect(query).toContain('`QUERY`')
    expect(query).not.toContain('List pets')
    expect(get).not.toContain('Search pets')
  })
})
