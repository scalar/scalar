import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it } from 'vitest'

import { loadDocumentFromSource } from './load-document-from-source'

describe('loadDocumentFromSource', () => {
  it('returns false when source is null', async () => {
    const workspaceStore = createWorkspaceStore()

    const result = await loadDocumentFromSource(workspaceStore, null, 'My API', false)

    expect(result).toBe(false)
  })

  it('adds document from raw JSON content', async () => {
    const workspaceStore = createWorkspaceStore()

    const rawOpenAPI = JSON.stringify({
      openapi: '3.1.0',
      info: {
        title: 'Raw API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
    })

    const result = await loadDocumentFromSource(workspaceStore, rawOpenAPI, 'Raw API', false)

    expect(result).toBe(true)

    // Find the document that was added
    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Raw API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Raw API')
    expect(addedDocument?.info.version).toBe('1.0.0')
    expect(addedDocument?.paths?.['/users']).toBeDefined()
  })

  it('adds document from raw YAML content', async () => {
    const workspaceStore = createWorkspaceStore()

    const rawYAML = `
openapi: 3.1.0
info:
  title: YAML API
  version: 2.0.0
paths:
  /products:
    get:
      summary: Get products
      responses:
        '200':
          description: Success
`

    const result = await loadDocumentFromSource(workspaceStore, rawYAML, 'YAML API', true)

    expect(result).toBe(true)

    // Find the document that was added
    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'YAML API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('YAML API')
    expect(addedDocument?.info.version).toBe('2.0.0')
    expect(addedDocument?.paths?.['/products']).toBeDefined()
    // Watch mode should be ignored for raw content
    expect(addedDocument?.['x-scalar-watch-mode']).toBeUndefined()
  })

  it('handles complex OpenAPI document with multiple operations', async () => {
    const workspaceStore = createWorkspaceStore()

    const complexOpenAPI = JSON.stringify({
      openapi: '3.1.0',
      info: {
        title: 'Complex API',
        version: '3.0.0',
        description: 'A more complex API with multiple paths',
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
        },
      ],
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
          post: {
            summary: 'Create user',
            operationId: 'createUser',
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            summary: 'Get user by ID',
            operationId: 'getUser',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
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

    const result = await loadDocumentFromSource(workspaceStore, complexOpenAPI, 'Complex API', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Complex API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Complex API')
    expect(addedDocument?.info.version).toBe('3.0.0')
    expect(addedDocument?.info.description).toBe('A more complex API with multiple paths')
    expect(addedDocument?.paths?.['/users']).toBeDefined()
    expect(addedDocument?.paths?.['/users/{id}']).toBeDefined()
    expect(addedDocument?.servers).toBeDefined()
    expect(addedDocument?.servers?.length).toBe(1)
  })

  it('normalizes and adds minified JSON content', async () => {
    const workspaceStore = createWorkspaceStore()

    // Minified JSON without any formatting
    const minifiedJSON =
      '{"openapi":"3.1.0","info":{"title":"Minified API","version":"1.0.0"},"paths":{"/test":{"get":{"responses":{"200":{"description":"OK"}}}}}}'

    const result = await loadDocumentFromSource(workspaceStore, minifiedJSON, 'Minified API', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Minified API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Minified API')
    expect(addedDocument?.paths?.['/test']).toBeDefined()
  })
})
