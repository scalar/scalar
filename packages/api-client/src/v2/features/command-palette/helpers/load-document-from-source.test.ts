import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { assert, describe, expect, it } from 'vitest'

import type { ImportEventData } from './load-document-from-source'
import { loadDocumentFromSource } from './load-document-from-source'

describe('loadDocumentFromSource', () => {
  it('returns false when source is empty', async () => {
    const workspaceStore = createWorkspaceStore()

    const importEventData: ImportEventData = {
      source: '',
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'My API', false)

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

    const importEventData: ImportEventData = {
      source: rawOpenAPI,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Raw API', false)

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

    const importEventData: ImportEventData = {
      source: rawYAML,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'YAML API', true)

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

    const importEventData: ImportEventData = {
      source: complexOpenAPI,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Complex API', false)

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

    const importEventData: ImportEventData = {
      source: minifiedJSON,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Minified API', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Minified API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Minified API')
    expect(addedDocument?.paths?.['/test']).toBeDefined()
  })

  it('converts and adds valid Postman collection', async () => {
    const workspaceStore = createWorkspaceStore()

    const postmanCollection = JSON.stringify({
      info: {
        _postman_id: '12345-abcde',
        name: 'My Postman API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get Users',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['users'],
            },
          },
        },
      ],
    })

    const importEventData: ImportEventData = {
      source: postmanCollection,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'My Postman API', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'My Postman API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('My Postman API')
    // Verify it was converted to OpenAPI
    expect(addedDocument?.openapi).toBeDefined()
  })

  it('handles Postman collection with multiple requests', async () => {
    const workspaceStore = createWorkspaceStore()

    const complexPostmanCollection = JSON.stringify({
      info: {
        _postman_id: 'complex-123',
        name: 'Complex Postman Collection',
        description: 'A collection with multiple requests',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Users',
          item: [
            {
              name: 'List Users',
              request: {
                method: 'GET',
                url: 'https://api.example.com/users',
              },
            },
            {
              name: 'Create User',
              request: {
                method: 'POST',
                url: 'https://api.example.com/users',
                body: {
                  mode: 'raw',
                  raw: '{"name":"John"}',
                },
              },
            },
          ],
        },
        {
          name: 'Products',
          item: [
            {
              name: 'List Products',
              request: {
                method: 'GET',
                url: 'https://api.example.com/products',
              },
            },
          ],
        },
      ],
    })

    const importEventData: ImportEventData = {
      source: complexPostmanCollection,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Complex Postman Collection', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Complex Postman Collection')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Complex Postman Collection')
    expect(addedDocument?.openapi).toBeDefined()
    // Verify paths were converted
    expect(addedDocument?.paths).toBeDefined()
  })

  it('ignores watch mode when adding Postman collection', async () => {
    const workspaceStore = createWorkspaceStore()

    const postmanCollection = JSON.stringify({
      info: {
        _postman_id: 'watch-test-123',
        name: 'Postman Collection Watch Test',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    })

    const importEventData: ImportEventData = {
      source: postmanCollection,
      type: 'raw',
    }

    // Pass watchMode as true, but it should be ignored for Postman collections
    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Postman Collection Watch Test', true)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Postman Collection Watch Test')

    expect(addedDocument).toBeDefined()
    // Watch mode should not be set for Postman collections
    expect(addedDocument?.['x-scalar-watch-mode']).toBeUndefined()
  })

  it('returns false when Postman conversion fails', async () => {
    const workspaceStore = createWorkspaceStore()

    // Invalid Postman collection that will fail conversion
    // This is a valid Postman structure but may fail internal conversion
    const invalidPostmanCollection = JSON.stringify({
      info: {
        _postman_id: 'invalid-123',
        name: 'Invalid Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          // Intentionally malformed request that might cause conversion issues
          name: 'Bad Request',
          request: null,
        },
      ],
    })

    const importEventData: ImportEventData = {
      source: invalidPostmanCollection,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Invalid Collection', false)
    expect(result).toBe(false)
  })

  it('handles empty Postman collection', async () => {
    const workspaceStore = createWorkspaceStore()

    const emptyPostmanCollection = JSON.stringify({
      info: {
        _postman_id: 'empty-123',
        name: 'Empty Postman Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    })

    const importEventData: ImportEventData = {
      source: emptyPostmanCollection,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Empty Postman Collection', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Empty Postman Collection')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.info.title).toBe('Empty Postman Collection')
    expect(addedDocument?.openapi).toBeDefined()
  })

  it('handles Postman collection with authentication', async () => {
    const workspaceStore = createWorkspaceStore()

    const postmanWithAuth = JSON.stringify({
      info: {
        _postman_id: 'auth-123',
        name: 'Authenticated API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{bearerToken}}',
            type: 'string',
          },
        ],
      },
      item: [
        {
          name: 'Protected Endpoint',
          request: {
            method: 'GET',
            url: 'https://api.example.com/protected',
          },
        },
      ],
    })

    const importEventData: ImportEventData = {
      source: postmanWithAuth,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Authenticated API', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'Authenticated API')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.openapi).toBeDefined()
  })

  it('returns false for invalid content that cannot be normalized', async () => {
    const workspaceStore = createWorkspaceStore()

    // Content that is not valid JSON, YAML, or Postman
    const invalidContent = 'This is just plain text, not a valid API document'

    const importEventData: ImportEventData = {
      source: invalidContent,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'Invalid Doc', false)

    expect(result).toBe(false)
  })

  it('handles Postman collection with variables', async () => {
    const workspaceStore = createWorkspaceStore()

    const postmanWithVariables = JSON.stringify({
      info: {
        _postman_id: 'vars-123',
        name: 'API with Variables',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.example.com',
          type: 'string',
        },
        {
          key: 'apiKey',
          value: 'secret-key',
          type: 'string',
        },
      ],
      item: [
        {
          name: 'Get Data',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/data',
            header: [
              {
                key: 'X-API-Key',
                value: '{{apiKey}}',
              },
            ],
          },
        },
      ],
    })

    const importEventData: ImportEventData = {
      source: postmanWithVariables,
      type: 'raw',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'API with Variables', false)

    expect(result).toBe(true)

    const documents = Object.values(workspaceStore.workspace.documents)
    const addedDocument = documents.find((doc) => doc.info.title === 'API with Variables')

    expect(addedDocument).toBeDefined()
    expect(addedDocument?.openapi).toBeDefined()
  })

  it('adds document from file path', async () => {
    const workspaceStore = createWorkspaceStore({
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: () => {
          return Promise.resolve({
            ok: true,
            data: { openapi: '3.1.0', info: { title: 'File API' } },
            raw: 'This is a test file',
          })
        },
      },
    })

    const importEventData: ImportEventData = {
      source: '/path/to/openapi.yaml',
      type: 'file',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'file-api', false)

    expect(result).toBe(true)

    const document = workspaceStore.workspace.documents['file-api']

    expect(document).toBeDefined()
    assert(document)

    expect(document['x-scalar-original-source-url']).toBe('/path/to/openapi.yaml')
    expect(document['x-scalar-watch-mode']).toBeUndefined()
  })

  it('ignores watch mode when adding document from file', async () => {
    const workspaceStore = createWorkspaceStore({
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: () => {
          return Promise.resolve({
            ok: true,
            data: { openapi: '3.1.0', info: { title: 'File API Watch Test' } },
            raw: 'This is a test file',
          })
        },
      },
    })

    const importEventData: ImportEventData = {
      source: '/path/to/openapi.yaml',
      type: 'file',
    }

    const result = await loadDocumentFromSource(workspaceStore, importEventData, 'file-api-watch-test', true)

    expect(result).toBe(true)

    const document = workspaceStore.workspace.documents['file-api-watch-test']

    expect(document).toBeDefined()
    assert(document)

    expect(document['x-scalar-original-source-url']).toBe('/path/to/openapi.yaml')
    expect(document['x-scalar-watch-mode']).toBeUndefined()
  })
})
