import { assert, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'

import {
  addResponseToHistory,
  createOperation,
  deleteAllOperationParameters,
  deleteOperation,
  deleteOperationExample,
  deleteOperationParameter,
  reloadOperationHistory,
  updateOperationExtraParameters,
  updateOperationPathMethod,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormValue,
  updateOperationSummary,
  upsertOperationParameter,
} from './operation'

const createDocument = (initial?: Partial<WorkspaceDocument>): WorkspaceDocument => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

describe('updateOperationSummary', () => {
  it('updates summary for an existing operation', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            summary: 'Old summary',
          },
        },
      },
    })

    updateOperationSummary(document, {
      meta: { method: 'get', path: '/users' },
      payload: { summary: 'New summary' },
    })

    expect(document.paths?.['/users']?.get?.summary).toBe('New summary')
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationSummary(null, {
        meta: { method: 'get', path: '/users' },
        payload: { summary: 'Anything' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationSummary(document, {
      meta: { method: 'get', path: '/users' },
      payload: { summary: 'New summary' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})

describe('updateOperationPathMethod (method only)', () => {
  const store = createWorkspaceStore()

  it('replaces the x-scalar-order with the new ID', async () => {
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              description: 'Retrieve list of users',
              parameters: [{ name: 'limit', in: 'query' }],
            },
            post: {
              summary: 'Post users',
              description: 'Create a new user',
              parameters: [{ name: 'name', in: 'query' }],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!
    expect(document['x-scalar-order']).toStrictEqual(['test/GET/users', 'test/POST/users'])

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users' },
      payload: { method: 'put', path: '/users' },
      callback: (_status) => {
        return
      },
    })
    expect(document['x-scalar-order']).toStrictEqual(['test/PUT/users', 'test/POST/users'])

    // The operation should now be under 'put'
    expect(document.paths?.['/users']).toStrictEqual({
      post: {
        summary: 'Post users',
        description: 'Create a new user',
        parameters: [{ name: 'name', in: 'query' }],
      },
      put: {
        summary: 'Get users',
        description: 'Retrieve list of users',
        parameters: [{ name: 'limit', in: 'query' }],
      },
    })
  })

  it('updates all operations in all tags while preserving the order', async () => {
    await store.addDocument({
      name: 'test2',
      document: createDocument({
        tags: [
          {
            name: 'products',
            description: 'Products',
          },
          {
            name: 'catalog',
            description: 'Catalog',
          },
          {
            name: 'admin',
            description: 'Admin',
          },
        ],
        paths: {
          '/products': {
            get: {
              summary: 'Get products',
              description: 'Retrieve list of products',
              tags: ['products', 'catalog'],
              parameters: [{ name: 'limit', in: 'query' }],
            },
            delete: {
              summary: 'Delete product',
              description: 'Remove a product',
              tags: ['products', 'admin'],
              parameters: [{ name: 'id', in: 'path' }],
            },
          },
        },
      }),
    })
    store.buildSidebar('test2')
    const document = store.workspace.documents.test2!
    expect(document.tags?.[0]?.['x-scalar-order']).toStrictEqual([
      'test2/tag/products/GET/products',
      'test2/tag/products/DELETE/products',
    ])

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/products' },
      payload: { method: 'patch', path: '/products' },
      callback: (_status) => {
        return
      },
    })

    expect(document.tags?.[0]?.['x-scalar-order']).toStrictEqual([
      'test2/tag/products/PATCH/products',
      'test2/tag/products/DELETE/products',
    ])

    // The operation should now be under 'patch' with all properties preserved
    expect(document.paths?.['/products']).toStrictEqual({
      delete: {
        summary: 'Delete product',
        description: 'Remove a product',
        tags: ['products', 'admin'],
        parameters: [{ name: 'id', in: 'path' }],
      },
      patch: {
        summary: 'Get products',
        description: 'Retrieve list of products',
        tags: ['products', 'catalog'],
        parameters: [{ name: 'limit', in: 'query' }],
      },
    })
  })

  it('calls callback with success status after updating method', async () => {
    await store.addDocument({
      name: 'test3',
      document: createDocument({
        paths: {
          '/items': {
            get: {
              summary: 'Get items',
              description: 'Retrieve items',
            },
          },
        },
      }),
    })
    store.buildSidebar('test3')
    const document = store.workspace.documents.test3!

    let callbackResult: 'success' | 'no-change' | 'conflict' | undefined

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/items' },
      payload: { method: 'post', path: '/items' },
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('success')
    expect(document.paths?.['/items']?.post).toBeDefined()
    expect(document.paths?.['/items']?.get).toBeUndefined()
  })
})

describe('updateOperationPathMethod (path only)', () => {
  it('moves operation to a new path and removes from old path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              description: 'Retrieve all users',
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users' },
      payload: { method: 'get', path: '/api/users' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/api/users': {
        get: {
          summary: 'Get users',
          description: 'Retrieve all users',
        },
      },
    })
  })

  it('preserves all operation properties when moving to new path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/posts': {
            post: {
              summary: 'Create post',
              description: 'Creates a new post',
              operationId: 'createPost',
              tags: ['posts'],
              parameters: [{ name: 'X-Api-Key', in: 'header' }],
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                  },
                },
              },
              responses: {
                '201': { description: 'Created' },
              },
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'post', path: '/posts' },
      payload: { method: 'post', path: '/api/v2/posts' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/api/v2/posts': {
        post: {
          summary: 'Create post',
          description: 'Creates a new post',
          operationId: 'createPost',
          tags: ['posts'],
          parameters: [{ name: 'X-Api-Key', in: 'header' }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
          },
        },
      },
    })
  })

  it('keeps other operations on old path when moving one operation', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
            post: {
              summary: 'Create user',
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users' },
      payload: { method: 'get', path: '/api/users' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/users': {
        post: {
          summary: 'Create user',
        },
      },
      '/api/users': {
        get: {
          summary: 'Get users',
        },
      },
    })
  })

  it('maintains the path params', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users/{id}': {
            get: {
              summary: 'Get users',
              parameters: [
                { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
                { name: 'name', in: 'query' },
              ],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users/{id}' },
      payload: { method: 'get', path: '/events/{id}' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/events/{id}': {
        get: {
          summary: 'Get users',
          parameters: [
            { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
            { name: 'name', in: 'query' },
          ],
        },
      },
    })
  })

  it('handles partial path params', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users/{id}': {
            get: {
              summary: 'Get users',
              parameters: [
                { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
                { name: 'name', in: 'query' },
              ],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users/{id}' },
      payload: { method: 'get', path: '/events/{id}/started{avar' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/events/{id}/started{avar': {
        get: {
          summary: 'Get users',
          parameters: [
            { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
            { name: 'name', in: 'query' },
          ],
        },
      },
    })
  })

  it('maintains swapped path params', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users/{id}/{limit}': {
            get: {
              summary: 'Get users',
              parameters: [
                { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
                { name: 'limit', in: 'path', examples: { test: { value: '10' } } },
                { name: 'name', in: 'query' },
              ],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users/{id}/{limit}' },
      payload: { method: 'get', path: '/events/{limit}/{id}' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/events/{limit}/{id}': {
        get: {
          summary: 'Get users',
          parameters: [
            { name: 'limit', in: 'path', examples: { test: { value: '10' } } },
            { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
            { name: 'name', in: 'query' },
          ],
        },
      },
    })
  })

  it('renames path params', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users/{id}': {
            get: {
              summary: 'Get users',
              parameters: [
                { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
                { name: 'name', in: 'query' },
              ],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users/{id}' },
      payload: { method: 'get', path: '/users/{limit}' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/users/{limit}': {
        get: {
          summary: 'Get users',
          parameters: [
            { name: 'limit', in: 'path', examples: { test: { value: '1212' } } },
            { name: 'name', in: 'query' },
          ],
        },
      },
    })
  })

  it('creates new path params', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users/{id}': {
            get: {
              summary: 'Get users',
              parameters: [
                { name: 'id', in: 'path', examples: { test: { value: '1212' } } },
                { name: 'name', in: 'query' },
              ],
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/users/{id}' },
      payload: { method: 'get', path: '/users/events/{limit}' },
      callback: () => {
        return
      },
    })

    expect(document.paths).toStrictEqual({
      '/users/events/{limit}': {
        get: {
          summary: 'Get users',
          parameters: [
            { name: 'limit', in: 'path' },
            { name: 'name', in: 'query' },
          ],
        },
      },
    })
  })

  it('calls callback with success status after updating path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/items': {
            get: {
              summary: 'Get items',
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    let callbackResult: 'success' | 'no-change' | 'conflict' | undefined

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/items' },
      payload: { method: 'get', path: '/api/items' },
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('success')
    expect(document.paths?.['/api/items']?.get).toBeDefined()
    expect(document.paths?.['/items']).toBeUndefined()
  })

  it('calls callback with conflict status when target path and method already exists', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/items': {
            get: {
              summary: 'Get items',
            },
          },
          '/api/items': {
            get: {
              summary: 'Get API items',
            },
          },
        },
      }),
    })
    store.buildSidebar('test')
    const document = store.workspace.documents.test!

    let callbackResult: 'success' | 'no-change' | 'conflict' | undefined

    updateOperationPathMethod(document, store, {
      meta: { method: 'get', path: '/items' },
      payload: { method: 'get', path: '/api/items' },
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('conflict')
    // Original operations should remain unchanged
    expect(document.paths?.['/items']?.get?.summary).toBe('Get items')
    expect(document.paths?.['/api/items']?.get?.summary).toBe('Get API items')
  })
})

describe('createOperation', () => {
  it('creates a new operation at the specified path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument(),
    })
    store.buildSidebar('test')

    const normalizedPath = createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
        description: 'Retrieve all users',
      },
    })

    expect(normalizedPath).toBe('/users')
    const document = store.workspace.documents.test!
    expect(document.paths?.['/users']?.get).toEqual({
      summary: 'Get users',
      description: 'Retrieve all users',
    })
  })

  it('normalizes path by adding leading slash', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument(),
    })
    store.buildSidebar('test')

    const normalizedPath = createOperation(store, {
      documentName: 'test',
      path: 'users',
      method: 'post',
      operation: {
        summary: 'Create user',
      },
    })

    expect(normalizedPath).toBe('/users')
    const document = store.workspace.documents.test!
    expect(document.paths?.['/users']?.post).toBeDefined()
  })

  it('calls callback with success status', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument(),
    })
    store.buildSidebar('test')

    let callbackResult: boolean | undefined

    createOperation(store, {
      documentName: 'test',
      path: '/items',
      method: 'get',
      operation: {},
      callback: (success) => {
        callbackResult = success
      },
    })

    expect(callbackResult).toBe(true)
  })

  it('returns undefined and calls callback with false when document does not exist', () => {
    const store = createWorkspaceStore()

    let callbackResult: boolean | undefined

    const result = createOperation(store, {
      documentName: 'nonexistent',
      path: '/users',
      method: 'get',
      operation: {},
      callback: (success) => {
        callbackResult = success
      },
    })

    expect(result).toBeUndefined()
    expect(callbackResult).toBe(false)
  })

  it('returns undefined when store is null', () => {
    const result = createOperation(null, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {},
    })

    expect(result).toBeUndefined()
  })

  it('adds operation to existing path with other methods', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
          },
        },
      }),
    })
    store.buildSidebar('test')

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'post',
      operation: {
        summary: 'Create user',
      },
    })

    const document = store.workspace.documents.test!
    expect(document.paths?.['/users']?.get).toEqual({ summary: 'Get users' })
    expect(document.paths?.['/users']?.post).toEqual({ summary: 'Create user' })
  })

  it('adds operation server to document servers when it does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        servers: [{ url: 'https://existing.example.com' }],
      }),
    })

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
        servers: [{ url: 'https://new.example.com' }],
      },
    })

    const document = store.workspace.documents.test!
    expect(document.servers).toHaveLength(2)
    expect(document.servers).toContainEqual({ url: 'https://existing.example.com' })
    expect(document.servers).toContainEqual({ url: 'https://new.example.com' })
  })

  it('does not duplicate server when operation server already exists in document', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        servers: [{ url: 'https://api.example.com' }],
      }),
    })

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
        servers: [{ url: 'https://api.example.com' }],
      },
    })

    const document = store.workspace.documents.test!
    expect(document.servers).toHaveLength(1)
    expect(document.servers?.[0]?.url).toBe('https://api.example.com')
  })

  it('adds multiple operation servers to document servers', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        servers: [{ url: 'https://existing.example.com' }],
      }),
    })
    store.buildSidebar('test')

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
        servers: [{ url: 'https://server1.example.com' }, { url: 'https://server2.example.com' }],
      },
    })

    const document = store.workspace.documents.test!
    expect(document.servers).toHaveLength(3)
    expect(document.servers).toContainEqual({ url: 'https://existing.example.com' })
    expect(document.servers).toContainEqual({ url: 'https://server1.example.com' })
    expect(document.servers).toContainEqual({ url: 'https://server2.example.com' })
  })

  it('updates selected server to first operation server', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        servers: [{ url: 'https://existing.example.com' }],
        'x-scalar-selected-server': 'https://existing.example.com',
      }),
    })
    store.buildSidebar('test')

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
        servers: [{ url: 'https://new.example.com' }],
      },
    })

    const document = store.workspace.documents.test!
    expect(document['x-scalar-selected-server']).toBe('https://new.example.com')
  })

  it('does not update selected server when operation has no servers', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createDocument({
        servers: [{ url: 'https://existing.example.com' }],
        'x-scalar-selected-server': 'https://existing.example.com',
      }),
    })

    createOperation(store, {
      documentName: 'test',
      path: '/users',
      method: 'get',
      operation: {
        summary: 'Get users',
      },
    })

    const document = store.workspace.documents.test!
    expect(document['x-scalar-selected-server']).toBe('https://existing.example.com')
  })
})

describe('upsertOperationParameter', () => {
  it('adds a query parameter with example and enabled state when it does not exist', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [{ name: 'X-Trace', in: 'header' }],
          },
        },
      },
    })

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: null,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { name: 'q', value: 'john', isDisabled: false },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(2)
    const last = params[params.length - 1]
    expect(last).toMatchObject({ name: 'q', in: 'query', required: false })
    assert(last && 'examples' in last && last.examples)
    expect(getResolvedRef(last.examples.default)?.value).toBe('john')
    expect(getResolvedRef(last.examples.default)?.['x-disabled']).toBe(false)
  })

  it('adds a path parameter and marks it required', () => {
    const document = createDocument({
      paths: {
        '/users/{id}': {
          get: {},
        },
      },
    })

    upsertOperationParameter(document, {
      type: 'path',
      originalParameter: null,
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { name: 'id', value: '123', isDisabled: false },
    })

    const op = getResolvedRef(document.paths?.['/users/{id}']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(1)
    const only = params[0]
    expect(only).toMatchObject({ name: 'id', in: 'path', required: true })
    assert(only && 'examples' in only && only.examples)
    expect(getResolvedRef(only.examples?.default)?.value).toBe('123')
    // Note: When adding a new parameter, x-disabled is always set to false initially
    expect(getResolvedRef(only.examples?.default)?.['x-disabled']).toBe(false)
  })

  it('updates an existing query parameter by passing originalParameter', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'X-Trace', in: 'header' },
              { name: 'q', in: 'query', examples: { default: { value: 'one' } } },
              { name: 'p', in: 'query', examples: { default: { value: 'two' } } },
            ],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const secondQueryParam = getResolvedRef(op.parameters?.[2])
    assert(secondQueryParam)

    // Update the second query parameter
    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: secondQueryParam,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { name: 'page', value: '2', isDisabled: false },
    })

    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    // Header unchanged
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    // First query unchanged
    const firstQuery = params[1]
    assert(firstQuery && 'examples' in firstQuery && firstQuery.examples)
    expect(firstQuery).toMatchObject({ name: 'q', in: 'query' })
    expect(getResolvedRef(firstQuery.examples.default)?.value).toBe('one')
    // Second query updated
    const secondQuery = params[2]
    assert(secondQuery && 'examples' in secondQuery && secondQuery.examples)
    expect(secondQuery).toMatchObject({ name: 'page', in: 'query' })
    expect(getResolvedRef(secondQuery.examples.default)?.value).toBe('2')
    expect(getResolvedRef(secondQuery.examples.default)?.['x-disabled']).toBe(false)
  })

  it('updates value and disabled state when parameter exists', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [{ name: 'q', in: 'query', examples: { default: { value: 'one' } } }],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const param = getResolvedRef(op.parameters?.[0])
    assert(param)

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: param,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { name: 'q', value: 'ONE', isDisabled: false },
    })

    assert(param && 'examples' in param && param.examples)
    expect(getResolvedRef(param.examples.default)?.value).toBe('ONE')
    expect(getResolvedRef(param.examples.default)?.['x-disabled']).toBe(false)
  })

  it('updates name and creates new example for different exampleKey', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [{ name: 'q', in: 'query', examples: { default: { value: 'one' } } }],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const param = getResolvedRef(op.parameters?.[0])
    assert(param)

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: param,
      meta: { method: 'get', path: '/search', exampleKey: 'other' },
      payload: { name: 'query', value: 'new value', isDisabled: false },
    })

    // Name should update
    expect(param?.name).toBe('query')
    // Both examples should exist
    assert(param && 'examples' in param && param.examples)
    expect(getResolvedRef(param.examples.other)?.value).toBe('new value')
    expect(getResolvedRef(param.examples.default)?.value).toBe('one')
  })

  it('only updates the specific parameter passed as originalParameter', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'X-Trace', in: 'header', examples: { default: { value: 'abc' } } },
              { name: 'q', in: 'query', examples: { default: { value: 'one' } } },
            ],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const queryParam = getResolvedRef(op.parameters?.[1])
    assert(queryParam)

    // Update only the query parameter
    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: queryParam,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { name: 'query', value: '1', isDisabled: false },
    })

    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    const updatedQueryParam = params[1]
    assert(updatedQueryParam && 'examples' in updatedQueryParam)
    expect(updatedQueryParam?.name).toBe('query')
    expect(getResolvedRef(updatedQueryParam?.examples?.default as any)?.value).toBe('1')
  })

  it('adds multiple parameters of different types', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {},
        },
      },
    })

    upsertOperationParameter(document, {
      type: 'header',
      originalParameter: null,
      meta: { method: 'get', path: '/users', exampleKey: 'default' },
      payload: { name: 'Authorization', value: 'Bearer token', isDisabled: false },
    })

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: null,
      meta: { method: 'get', path: '/users', exampleKey: 'default' },
      payload: { name: 'limit', value: '10', isDisabled: false },
    })

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: null,
      meta: { method: 'get', path: '/users', exampleKey: 'default' },
      payload: { name: 'offset', value: '0', isDisabled: false },
    })

    const op = getResolvedRef(document.paths?.['/users']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(3)
    expect(params[0]).toMatchObject({ name: 'Authorization', in: 'header' })
    expect(params[1]).toMatchObject({ name: 'limit', in: 'query' })
    expect(params[2]).toMatchObject({ name: 'offset', in: 'query' })
    assert(params[2] && 'examples' in params[2] && params[2].examples)
    // Note: When adding a new parameter, x-disabled is always set to false initially
    expect(getResolvedRef(params[2].examples.default)?.['x-disabled']).toBe(false)
  })

  it('no-ops when document is null', () => {
    expect(() =>
      upsertOperationParameter(null, {
        type: 'query',
        originalParameter: null,
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
        payload: { name: 'q', value: 'x', isDisabled: false },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist and no originalParameter is provided', () => {
    const document = createDocument({
      paths: {
        '/missing': {},
      },
    })

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: null,
      meta: { method: 'get', path: '/missing', exampleKey: 'default' },
      payload: { name: 'q', value: 'x', isDisabled: false },
    })

    expect(document.paths?.['/missing']).toEqual({})
  })
})

describe('deleteOperationParameter', () => {
  it('deletes a specific parameter using originalParameter', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'X-Trace', in: 'header', examples: { default: { value: 'a' } } },
              { name: 'q', in: 'query', examples: { default: { value: 'one' } } },
              { name: 'page', in: 'query', examples: { default: { value: '2' } } },
            ],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const pageParam = getResolvedRef(op.parameters?.[2])
    assert(pageParam)

    // Delete the page parameter
    deleteOperationParameter(document, {
      originalParameter: pageParam,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
    })

    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(2)
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    expect(params[1]).toMatchObject({ name: 'q', in: 'query' })
  })

  it('no-ops when document is null', () => {
    const testParam = { name: 'test', in: 'query' as const }
    expect(() =>
      deleteOperationParameter(null, {
        originalParameter: testParam,
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/search': {},
      },
    })

    const testParam = { name: 'test', in: 'query' as const }
    deleteOperationParameter(document, {
      originalParameter: testParam,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
    })

    expect(document.paths?.['/search']).toEqual({})
  })
})

describe('deleteAllOperationParameters', () => {
  it('deletes all parameters of the specified type, preserving others', () => {
    const document = createDocument({
      paths: {
        '/users/{id}': {
          get: {
            parameters: [
              {
                name: 'X-Trace',
                in: 'header',
                required: false,
                examples: { default: { value: 'a', 'x-disabled': false } },
              },
              { name: 'q', in: 'query', required: false, examples: { default: { value: 'one', 'x-disabled': false } } },
              {
                name: 'page',
                in: 'query',
                required: false,
                examples: { default: { value: '2', 'x-disabled': false } },
              },
              { name: 'id', in: 'path', required: true, examples: { default: { value: '123', 'x-disabled': false } } },
            ],
          },
        },
      },
    })

    deleteAllOperationParameters(document, {
      type: 'query',
      meta: { method: 'get', path: '/users/{id}' },
    })

    const op = getResolvedRef(document.paths?.['/users/{id}']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    // Should keep header and path, remove all queries
    expect(params).toEqual([
      { name: 'X-Trace', in: 'header', required: false, examples: { default: { value: 'a', 'x-disabled': false } } },
      { name: 'id', in: 'path', required: true, examples: { default: { value: '123', 'x-disabled': false } } },
    ])
  })

  it('no-ops when document is null', () => {
    expect(() =>
      deleteAllOperationParameters(null, {
        type: 'query',
        meta: { method: 'get', path: '/users/{id}' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    deleteAllOperationParameters(document, {
      type: 'query',
      meta: { method: 'get', path: '/users' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})

describe('updateOperationRequestBodyContentType', () => {
  it('sets x-scalar-selected-content-type for the exampleKey and creates requestBody when missing', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    updateOperationRequestBodyContentType(document, {
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { contentType: 'application/json' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    expect(rb['x-scalar-selected-content-type']?.default).toBe('application/json')
  })

  it('preserves existing content and only updates selected content type map', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: {
                'application/xml': {},
              },
            },
          },
        },
      },
    })

    updateOperationRequestBodyContentType(document, {
      meta: { method: 'post', path: '/upload', exampleKey: 'a' },
      payload: { contentType: 'text/plain' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    // content remains intact
    expect(rb.content?.['application/xml']).toBeDefined()
    // selection map updated
    expect(rb['x-scalar-selected-content-type']?.a).toBe('text/plain')
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationRequestBodyContentType(null, {
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
        payload: { contentType: 'application/json' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/upload': {},
      },
    })

    updateOperationRequestBodyContentType(document, {
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { contentType: 'application/json' },
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})

describe('updateOperationRequestBodyExample', () => {
  it('creates requestBody, contentType entry and example when missing', () => {
    const document = createDocument({
      paths: {
        '/users': {
          post: {},
        },
      },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: '{"name":"Ada"}',
    })

    const op = getResolvedRef(document.paths?.['/users']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/json']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toBe('{"name":"Ada"}')
  })

  it('updates existing example value if already present', () => {
    const document = createDocument({
      paths: {
        '/users': {
          post: {},
        },
      },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: 'v1',
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: 'v2',
    })

    const op = getResolvedRef(document.paths?.['/users']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/json']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toBe('v2')
  })

  it('creates a separate example for a different exampleKey', () => {
    const document = createDocument({
      paths: {
        '/users': {
          post: {},
        },
      },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'A' },
      payload: 'one',
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'B' },
      payload: 'two',
    })

    const op = getResolvedRef(document.paths?.['/users']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/json']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.A)?.value).toBe('one')
    expect(getResolvedRef(examples.B)?.value).toBe('two')
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationRequestBodyExample(null, {
        contentType: 'application/json',
        meta: { method: 'post', path: '/users', exampleKey: 'default' },
        payload: 'x',
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: 'x',
    })

    expect(document.paths?.['/users']).toEqual({})
  })

  it('handles broken $ref in requestBody by creating new object', () => {
    const document = createDocument({
      paths: {
        '/users': {
          post: {
            requestBody: {
              $ref: '#/broken',
              '$ref-value': {
                content: {},
              },
            },
          },
        },
      },
    })

    // Should not throw and should create a new requestBody object
    expect(() =>
      updateOperationRequestBodyExample(document, {
        contentType: 'application/json',
        meta: { method: 'post', path: '/users', exampleKey: 'default' },
        payload: '{"name":"Ada"}',
      }),
    ).not.toThrow()

    const op = getResolvedRef(document.paths?.['/users']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/json']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toBe('{"name":"Ada"}')
  })
})

// Note: Form row functions (addOperationRequestBodyFormRow, updateOperationRequestBodyFormRow,
// deleteOperationRequestBodyFormRow) do not exist. Form data is handled through
// updateOperationRequestBodyExample with array payloads.
// These tests have been removed as they test non-existent functionality.

describe('deleteOperation', () => {
  it('deletes an operation from a path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
            post: {
              summary: 'Create user',
            },
          },
        },
      }),
    })

    deleteOperation(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users' },
    })

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']?.get).toBeUndefined()
    expect(document?.paths?.['/users']?.post).toBeDefined()
  })

  it('removes the path entry when the last operation is deleted', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
          },
        },
      }),
    })

    deleteOperation(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users' },
    })

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']).toBeUndefined()
  })

  it('no-ops when store is null', () => {
    expect(() =>
      deleteOperation(null, {
        documentName: 'test-doc',
        meta: { method: 'get', path: '/users' },
      }),
    ).not.toThrow()
  })

  it('no-ops when document does not exist', () => {
    const store = createWorkspaceStore()

    expect(() =>
      deleteOperation(store, {
        documentName: 'non-existent',
        meta: { method: 'get', path: '/users' },
      }),
    ).not.toThrow()
  })

  it('no-ops when path does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
          },
        },
      }),
    })

    expect(() =>
      deleteOperation(store, {
        documentName: 'test-doc',
        meta: { method: 'get', path: '/non-existent' },
      }),
    ).not.toThrow()

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']?.get).toBeDefined()
  })

  it('no-ops when operation does not exist on path', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
          },
        },
      }),
    })

    expect(() =>
      deleteOperation(store, {
        documentName: 'test-doc',
        meta: { method: 'post', path: '/users' },
      }),
    ).not.toThrow()

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']?.get).toBeDefined()
  })

  it('deletes operation and leaves other paths intact', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: { summary: 'Get users' },
            post: { summary: 'Create user' },
          },
          '/products': {
            get: { summary: 'Get products' },
          },
        },
      }),
    })

    deleteOperation(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users' },
    })

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']?.get).toBeUndefined()
    expect(document?.paths?.['/users']?.post).toBeDefined()
    expect(document?.paths?.['/products']?.get).toBeDefined()
  })

  it('deletes multiple operations sequentially', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: { summary: 'Get users' },
            post: { summary: 'Create user' },
            delete: { summary: 'Delete user' },
          },
        },
      }),
    })

    deleteOperation(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users' },
    })
    deleteOperation(store, {
      documentName: 'test-doc',
      meta: { method: 'post', path: '/users' },
    })

    const document = store.workspace.documents['test-doc']
    expect(document?.paths?.['/users']?.get).toBeUndefined()
    expect(document?.paths?.['/users']?.post).toBeUndefined()
    expect(document?.paths?.['/users']?.delete).toBeDefined()
  })
})

describe('deleteOperationExample', () => {
  it('removes example from parameter-level examples', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  examples: {
                    default: { value: '10' },
                    custom: { value: '50' },
                  },
                },
              ],
            },
          },
        },
      }),
    })

    deleteOperationExample(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users', exampleKey: 'custom' },
    })

    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.get)
    const param = getResolvedRef(operation?.parameters?.[0])
    assert(param && 'examples' in param)
    expect(param.examples?.default).toBeDefined()
    expect(param.examples?.custom).toBeUndefined()
  })

  it('removes example from request body content types', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              requestBody: {
                content: {
                  'application/json': {
                    examples: {
                      default: { value: '{"name":"John"}' },
                      custom: { value: '{"name":"Jane"}' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    })

    deleteOperationExample(store, {
      documentName: 'test-doc',
      meta: { method: 'post', path: '/users', exampleKey: 'custom' },
    })

    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.post)
    const requestBody = getResolvedRef(operation?.requestBody)
    const examples = requestBody?.content?.['application/json']?.examples
    expect(examples?.default).toBeDefined()
    expect(examples?.custom).toBeUndefined()
  })

  it('removes example from multiple content types in request body', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              requestBody: {
                content: {
                  'application/json': {
                    examples: {
                      default: { value: '{}' },
                      custom: { value: '{"json":true}' },
                    },
                  },
                  'application/xml': {
                    examples: {
                      default: { value: '<user/>' },
                      custom: { value: '<user><name>Test</name></user>' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    })

    deleteOperationExample(store, {
      documentName: 'test-doc',
      meta: { method: 'post', path: '/users', exampleKey: 'custom' },
    })

    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.post)
    const requestBody = getResolvedRef(operation?.requestBody)
    expect(requestBody?.content?.['application/json']?.examples?.default).toBeDefined()
    expect(requestBody?.content?.['application/json']?.examples?.custom).toBeUndefined()
    expect(requestBody?.content?.['application/xml']?.examples?.default).toBeDefined()
    expect(requestBody?.content?.['application/xml']?.examples?.custom).toBeUndefined()
  })

  it('removes example from both parameters and request body', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              parameters: [
                {
                  name: 'X-Custom-Header',
                  in: 'header',
                  examples: {
                    default: { value: 'header-default' },
                    custom: { value: 'header-custom' },
                  },
                },
              ],
              requestBody: {
                content: {
                  'application/json': {
                    examples: {
                      default: { value: '{}' },
                      custom: { value: '{"custom":true}' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    })

    deleteOperationExample(store, {
      documentName: 'test-doc',
      meta: { method: 'post', path: '/users', exampleKey: 'custom' },
    })

    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.post)
    const param = getResolvedRef(operation?.parameters?.[0])
    const requestBody = getResolvedRef(operation?.requestBody)

    assert(param && 'examples' in param)
    expect(param.examples?.default).toBeDefined()
    expect(param.examples?.custom).toBeUndefined()
    expect(requestBody?.content?.['application/json']?.examples?.default).toBeDefined()
    expect(requestBody?.content?.['application/json']?.examples?.custom).toBeUndefined()
  })

  it('no-ops when store is null', () => {
    expect(() =>
      deleteOperationExample(null, {
        documentName: 'test-doc',
        meta: { method: 'get', path: '/users', exampleKey: 'default' },
      }),
    ).not.toThrow()
  })

  it('no-ops when document does not exist', () => {
    const store = createWorkspaceStore()

    expect(() =>
      deleteOperationExample(store, {
        documentName: 'non-existent',
        meta: { method: 'get', path: '/users', exampleKey: 'default' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {},
        },
      }),
    })

    expect(() =>
      deleteOperationExample(store, {
        documentName: 'test-doc',
        meta: { method: 'get', path: '/users', exampleKey: 'default' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation has no request body', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  examples: {
                    default: { value: '10' },
                  },
                },
              ],
            },
          },
        },
      }),
    })

    expect(() =>
      deleteOperationExample(store, {
        documentName: 'test-doc',
        meta: { method: 'get', path: '/users', exampleKey: 'default' },
      }),
    ).not.toThrow()

    // Parameter example should still be deleted
    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.get)
    const param = getResolvedRef(operation?.parameters?.[0])
    assert(param && 'examples' in param)
    expect(param.examples?.default).toBeUndefined()
  })

  it('leaves other examples intact when deleting one', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  examples: {
                    default: { value: '10' },
                    small: { value: '5' },
                    large: { value: '100' },
                  },
                },
              ],
            },
          },
        },
      }),
    })

    deleteOperationExample(store, {
      documentName: 'test-doc',
      meta: { method: 'get', path: '/users', exampleKey: 'small' },
    })

    const document = store.workspace.documents['test-doc']
    const operation = getResolvedRef(document?.paths?.['/users']?.get)
    const param = getResolvedRef(operation?.parameters?.[0])
    assert(param && 'examples' in param)
    expect(param.examples?.default).toBeDefined()
    expect(param.examples?.small).toBeUndefined()
    expect(param.examples?.large).toBeDefined()
  })
})

describe('updateOperationExtraParameters', () => {
  it('sets isDisabled for a default header parameter', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/users', method: 'get', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/users']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default?.Authorization).toBe(true)
  })

  it('sets isDisabled for a global cookie parameter', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/users', method: 'get', exampleKey: 'default', name: 'session' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/users']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['global-cookies']?.default?.session).toBe(true)
  })

  it('initializes x-scalar-disable-parameters when it does not exist', () => {
    const document = createDocument({
      paths: {
        '/products': {
          post: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/products', method: 'post', exampleKey: 'example1', name: 'X-API-Key' },
      payload: { isDisabled: false },
    })

    const operation = getResolvedRef(document.paths?.['/products']?.post)
    assert(operation)
    expect(operation['x-scalar-disable-parameters']).toBeDefined()
    expect(operation['x-scalar-disable-parameters']?.['default-headers']).toBeDefined()
    expect(operation['x-scalar-disable-parameters']?.['default-headers']?.example1?.['X-API-Key']).toBe(false)
  })

  it('initializes default-headers when x-scalar-disable-parameters exists but default-headers does not', () => {
    const document = createDocument({
      paths: {
        '/items': {
          put: {
            'x-scalar-disable-parameters': {},
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/items', method: 'put', exampleKey: 'default', name: 'Content-Type' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/items']?.put)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default?.['Content-Type']).toBe(true)
  })

  it('initializes global-cookies when x-scalar-disable-parameters exists but global-cookies does not', () => {
    const document = createDocument({
      paths: {
        '/items': {
          put: {
            'x-scalar-disable-parameters': {},
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/items', method: 'put', exampleKey: 'default', name: 'auth_token' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/items']?.put)
    expect(operation?.['x-scalar-disable-parameters']?.['global-cookies']?.default?.auth_token).toBe(true)
  })

  it('preserves existing settings for other keys when updating one', () => {
    const document = createDocument({
      paths: {
        '/orders': {
          get: {
            'x-scalar-disable-parameters': {
              'default-headers': {
                default: {
                  Authorization: true,
                  'X-API-Version': false,
                },
              },
            },
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/orders', method: 'get', exampleKey: 'default', name: 'X-Request-ID' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/orders']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default).toEqual({
      Authorization: true,
      'X-API-Version': false,
      'X-Request-ID': true,
    })
  })

  it('updates an existing header parameter setting', () => {
    const document = createDocument({
      paths: {
        '/customers': {
          delete: {
            'x-scalar-disable-parameters': {
              'default-headers': {
                default: {
                  Authorization: false,
                },
              },
            },
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/customers', method: 'delete', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/customers']?.delete)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default?.Authorization).toBe(true)
  })

  it('handles multiple example keys independently', () => {
    const document = createDocument({
      paths: {
        '/reports': {
          get: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/reports', method: 'get', exampleKey: 'example1', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/reports', method: 'get', exampleKey: 'example2', name: 'Authorization' },
      payload: { isDisabled: false },
    })

    const operation = getResolvedRef(document.paths?.['/reports']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.example1?.Authorization).toBe(true)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.example2?.Authorization).toBe(false)
  })

  it('handles multiple headers in the same example key', () => {
    const document = createDocument({
      paths: {
        '/analytics': {
          post: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'Content-Type' },
      payload: { isDisabled: false },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'X-API-Key' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/analytics']?.post)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default).toEqual({
      Authorization: true,
      'Content-Type': false,
      'X-API-Key': true,
    })
  })

  it('handles multiple cookies in the same example key', () => {
    const document = createDocument({
      paths: {
        '/analytics': {
          post: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'session' },
      payload: { isDisabled: true },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'csrf_token' },
      payload: { isDisabled: false },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/analytics', method: 'post', exampleKey: 'default', name: 'tracking_id' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/analytics']?.post)
    expect(operation?.['x-scalar-disable-parameters']?.['global-cookies']?.default).toEqual({
      session: true,
      csrf_token: false,
      tracking_id: true,
    })
  })

  it('handles both default headers and global cookies independently', () => {
    const document = createDocument({
      paths: {
        '/mixed': {
          get: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/mixed', method: 'get', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    updateOperationExtraParameters(document, {
      type: 'global',
      in: 'cookie',
      meta: { path: '/mixed', method: 'get', exampleKey: 'default', name: 'session' },
      payload: { isDisabled: false },
    })

    const operation = getResolvedRef(document.paths?.['/mixed']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default?.Authorization).toBe(true)
    expect(operation?.['x-scalar-disable-parameters']?.['global-cookies']?.default?.session).toBe(false)
  })

  it('defaults to false when isDisabled is undefined', () => {
    const document = createDocument({
      paths: {
        '/webhook': {
          post: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/webhook', method: 'post', exampleKey: 'default', name: 'X-Webhook-Secret' },
      payload: { isDisabled: undefined },
    })

    const operation = getResolvedRef(document.paths?.['/webhook']?.post)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.default?.['X-Webhook-Secret']).toBe(false)
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationExtraParameters(null, {
        type: 'default',
        in: 'header',
        meta: { path: '/users', method: 'get', exampleKey: 'default', name: 'Authorization' },
        payload: { isDisabled: true },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/users', method: 'get', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    expect(document.paths?.['/users']).toEqual({})
  })

  it('no-ops when path does not exist', () => {
    const document = createDocument({
      paths: {
        '/existing': {
          get: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/nonexistent', method: 'get', exampleKey: 'default', name: 'Authorization' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/existing']?.get)
    expect(operation?.['x-scalar-disable-parameters']).toBeUndefined()
  })

  it('preserves existing settings for different example keys', () => {
    const document = createDocument({
      paths: {
        '/stats': {
          get: {
            'x-scalar-disable-parameters': {
              'default-headers': {
                example1: {
                  Authorization: true,
                },
              },
            },
          },
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'header',
      meta: { path: '/stats', method: 'get', exampleKey: 'example2', name: 'X-API-Key' },
      payload: { isDisabled: false },
    })

    const operation = getResolvedRef(document.paths?.['/stats']?.get)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.example1?.Authorization).toBe(true)
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']?.example2?.['X-API-Key']).toBe(false)
  })

  it('no-ops when type and location combination is invalid', () => {
    const document = createDocument({
      paths: {
        '/invalid': {
          get: {},
        },
      },
    })

    updateOperationExtraParameters(document, {
      type: 'default',
      in: 'cookie',
      meta: { path: '/invalid', method: 'get', exampleKey: 'default', name: 'invalid' },
      payload: { isDisabled: true },
    })

    const operation = getResolvedRef(document.paths?.['/invalid']?.get)
    expect(operation?.['x-scalar-disable-parameters']).toEqual({})
    expect(operation?.['x-scalar-disable-parameters']?.['default-headers']).toBeUndefined()
    expect(operation?.['x-scalar-disable-parameters']?.['global-cookies']).toBeUndefined()
  })
})

describe('updateOperationRequestBodyFormValue', () => {
  it('creates requestBody and stores form data as unpacked object', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    const formData = [
      { name: 'file', value: 'document.pdf', isDisabled: false },
      { name: 'description', value: 'Test upload', isDisabled: false },
    ]

    updateOperationRequestBodyFormValue(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: formData,
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['multipart/form-data']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toEqual(formData)
  })

  it('updates existing form data value', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    const initialFormData = [{ name: 'field1', value: 'value1', isDisabled: false }]
    const updatedFormData = [
      { name: 'field1', value: 'updated', isDisabled: false },
      { name: 'field2', value: 'value2', isDisabled: true },
    ]

    updateOperationRequestBodyFormValue(document, {
      contentType: 'application/x-www-form-urlencoded',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: initialFormData,
    })

    updateOperationRequestBodyFormValue(document, {
      contentType: 'application/x-www-form-urlencoded',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: updatedFormData,
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/x-www-form-urlencoded']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toEqual(updatedFormData)
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationRequestBodyFormValue(null, {
        contentType: 'multipart/form-data',
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
        payload: [{ name: 'test', value: 'value', isDisabled: false }],
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/upload': {},
      },
    })

    updateOperationRequestBodyFormValue(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: [{ name: 'test', value: 'value', isDisabled: false }],
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})

describe('addResponseToHistory', () => {
  it('adds a response to the operation history', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users/{id}': {
            get: {
              summary: 'Get user',
              parameters: [{ name: 'id', in: 'path', examples: { default: { value: '123' } } }],
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const mockRequest = {
      url: 'https://api.example.com/users/123',
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' }),
    } as Request

    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      ok: true,
      json: async () => ({ id: '123', name: 'John' }),
    } as Response

    await addResponseToHistory(store, document, {
      payload: {
        request: mockRequest,
        response: mockResponse,
        duration: 150,
        timestamp: Date.now(),
      },
      meta: {
        path: '/users/{id}',
        method: 'get',
        exampleKey: 'default',
      },
    })

    const history = store.history.getHistory('test-doc', '/users/{id}', 'get')
    expect(history).toBeDefined()
    expect(history?.length).toBe(1)

    const historyEntry = history?.[0]
    expect(historyEntry?.time).toBe(150)
    expect(historyEntry?.meta.example).toBe('default')
    expect(historyEntry?.requestMetadata.variables).toEqual({ id: '123' })
  })

  it('enforces history limit of 5 entries', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/items': {
            get: {
              summary: 'Get items',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const createMockPayload = (index: number) => ({
      payload: {
        request: {
          url: `https://api.example.com/items?page=${index}`,
          method: 'GET',
          headers: new Headers(),
        } as Request,
        response: {
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          ok: true,
        } as Response,
        duration: 100 + index,
        timestamp: Date.now(),
      },
      meta: {
        path: '/items',
        method: 'get' as const,
        exampleKey: 'default',
      },
    })

    // Add 6 history entries
    for (let i = 0; i < 6; i++) {
      await addResponseToHistory(store, document, createMockPayload(i))
    }

    const history = store.history.getHistory('test-doc', '/items', 'get')
    expect(history?.length).toBe(5)

    // Verify the oldest entry (index 0) was removed and entries 1-5 remain
    expect(history?.[0]?.time).toBe(101) // Second entry became first
    expect(history?.[4]?.time).toBe(105) // Last entry
  })

  it('initializes history array when it does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/products': {
            post: {
              summary: 'Create product',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const history = store.history.getHistory('test-doc', '/products', 'post')
    expect(history).toBeUndefined()

    await addResponseToHistory(store, document, {
      payload: {
        request: {
          url: 'https://api.example.com/products',
          method: 'POST',
          headers: new Headers(),
        } as Request,
        response: {
          status: 201,
          statusText: 'Created',
          headers: new Headers(),
          ok: true,
        } as Response,
        duration: 200,
        timestamp: Date.now(),
      },
      meta: {
        path: '/products',
        method: 'post',
        exampleKey: 'default',
      },
    })

    const updatedHistory = store.history.getHistory('test-doc', '/products', 'post')
    expect(updatedHistory).toBeDefined()
    expect(updatedHistory?.length).toBe(1)
  })

  it('handles multiple path variables', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users/{userId}/posts/{postId}': {
            get: {
              summary: 'Get user post',
              parameters: [
                { name: 'userId', in: 'path', examples: { default: { value: '456' } } },
                { name: 'postId', in: 'path', examples: { default: { value: '789' } } },
              ],
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    await addResponseToHistory(store, document, {
      payload: {
        request: {
          url: 'https://api.example.com/users/456/posts/789',
          method: 'GET',
          headers: new Headers(),
        } as Request,
        response: {
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          ok: true,
        } as Response,
        duration: 120,
        timestamp: Date.now(),
      },
      meta: {
        path: '/users/{userId}/posts/{postId}',
        method: 'get',
        exampleKey: 'default',
      },
    })

    const history = store.history.getHistory('test-doc', '/users/{userId}/posts/{postId}', 'get')
    const historyEntry = history?.[0]
    expect(historyEntry?.requestMetadata.variables).toEqual({
      userId: '456',
      postId: '789',
    })
  })

  it('stores the correct example key in history metadata', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/settings': {
            put: {
              summary: 'Update settings',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    await addResponseToHistory(store, document, {
      payload: {
        request: {
          url: 'https://api.example.com/settings',
          method: 'PUT',
          headers: new Headers(),
        } as Request,
        response: {
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          ok: true,
        } as Response,
        duration: 180,
        timestamp: Date.now(),
      },
      meta: {
        path: '/settings',
        method: 'put',
        exampleKey: 'custom-example',
      },
    })

    const history = store.history.getHistory('test-doc', '/settings', 'put')
    const historyEntry = history?.[0]
    expect(historyEntry?.meta.example).toBe('custom-example')
  })

  it('no-ops when store is null', async () => {
    await expect(
      addResponseToHistory(null, null, {
        payload: {
          request: {} as Request,
          response: {} as Response,
          duration: 100,
          timestamp: Date.now(),
        },
        meta: {
          path: '/test',
          method: 'get' as const,
          exampleKey: 'default',
        },
      }),
    ).resolves.not.toThrow()
  })

  it('no-ops when payload is null', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {
            get: {},
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    await expect(
      addResponseToHistory(store, document, {
        payload: null as any,
        meta: {
          path: '/test',
          method: 'get' as const,
          exampleKey: 'default',
        },
      }),
    ).resolves.not.toThrow()

    const history = store.history.getHistory('test-doc', '/test', 'get')
    expect(history).toBeUndefined()
  })

  it('no-ops when operation does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {},
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    await expect(
      addResponseToHistory(store, document, {
        payload: {
          request: {} as Request,
          response: {} as Response,
          duration: 100,
          timestamp: Date.now(),
        },
        meta: {
          path: '/test',
          method: 'get' as const,
          exampleKey: 'default',
        },
      }),
    ).resolves.not.toThrow()
  })
})

describe('reloadOperationHistory', () => {
  it('reloads a history item into the operation', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    // Add a history entry
    store.history.addHistory('test-doc', '/users', 'get', {
      time: 150,
      timestamp: Date.now(),
      request: {
        url: 'https://api.example.com/users?limit=10',
        method: 'GET',
        httpVersion: 'HTTP/1.1',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        cookies: [],
        queryString: [{ name: 'limit', value: '10' }],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 200,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: {
          size: 100,
          mimeType: 'application/json',
          text: '{"users":[]}',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: 100,
      },
      meta: {
        example: 'default',
      },
      requestMetadata: {
        variables: {},
      },
    })

    let callbackResult: string | undefined

    reloadOperationHistory(store, document, {
      meta: { path: '/users', method: 'get' },
      index: 0,
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('success')
  })

  it('reloads the correct history item by index', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/products': {
            get: {
              summary: 'Get products',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    // Add multiple history entries
    store.history.addHistory('test-doc', '/products', 'get', {
      time: 100,
      timestamp: Date.now(),
      request: {
        url: 'https://api.example.com/products?page=1',
        method: 'GET',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        queryString: [{ name: 'page', value: '1' }],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 200,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: 0, mimeType: 'application/json' },
        redirectURL: '',
        headersSize: -1,
        bodySize: 0,
      },
      meta: { example: 'default' },
      requestMetadata: { variables: {} },
    })

    store.history.addHistory('test-doc', '/products', 'get', {
      time: 200,
      timestamp: Date.now(),
      request: {
        url: 'https://api.example.com/products?page=2',
        method: 'GET',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        queryString: [{ name: 'page', value: '2' }],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 200,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: 0, mimeType: 'application/json' },
        redirectURL: '',
        headersSize: -1,
        bodySize: 0,
      },
      meta: { example: 'default' },
      requestMetadata: { variables: {} },
    })

    let callbackResult: string | undefined

    reloadOperationHistory(store, document, {
      meta: { path: '/products', method: 'get' },
      index: 1,
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('success')
  })

  it('handles history with path variables', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/orders/{orderId}': {
            get: {
              summary: 'Get order',
              parameters: [{ name: 'orderId', in: 'path' }],
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    // Add history with path variables
    store.history.addHistory('test-doc', '/orders/{orderId}', 'get', {
      time: 150,
      timestamp: Date.now(),
      request: {
        url: 'https://api.example.com/orders/12345',
        method: 'GET',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        queryString: [],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 200,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: 0, mimeType: 'application/json' },
        redirectURL: '',
        headersSize: -1,
        bodySize: 0,
      },
      meta: { example: 'default' },
      requestMetadata: {
        variables: { orderId: '12345' },
      },
    })

    let callbackResult: string | undefined

    reloadOperationHistory(store, document, {
      meta: { path: '/orders/{orderId}', method: 'get' },
      index: 0,
      callback: (status) => {
        callbackResult = status
      },
    })

    expect(callbackResult).toBe('success')

    // Verify that path parameters were reloaded
    const operation = getResolvedRef(document.paths?.['/orders/{orderId}']?.get)
    const param = getResolvedRef(operation?.parameters?.[0])
    assert(param && 'examples' in param)
    expect(getResolvedRef(param.examples?.draft)?.value).toBe('12345')
  })

  it('logs error when document is null', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(null, null, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: () => {
        return
      },
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Document not found', '/test', 'get')
    consoleErrorSpy.mockRestore()
  })

  it('logs error when operation does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {},
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(store, document, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: () => {
        return
      },
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Operation not found', '/test', 'get')
    consoleErrorSpy.mockRestore()
  })

  it('logs error when history item does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {
            get: {
              summary: 'Test',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(store, document, {
      meta: { path: '/test', method: 'get' },
      index: 5,
      callback: () => {
        return
      },
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('History item not found', 5)
    consoleErrorSpy.mockRestore()
  })

  it('handles operation with no history', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {
            get: {
              summary: 'Test',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(store, document, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: () => {
        return
      },
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('History item not found', 0)
    consoleErrorSpy.mockRestore()
  })

  it('does not call callback when document is missing', () => {
    const callbackSpy = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(null, null, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: callbackSpy,
    })

    expect(callbackSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('does not call callback when operation is missing', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {},
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const callbackSpy = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(store, document, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: callbackSpy,
    })

    expect(callbackSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('does not call callback when history item is missing', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/test': {
            get: {
              summary: 'Test',
            },
          },
        },
      }),
    })

    const document = store.workspace.documents['test-doc']!
    assert(document)

    const callbackSpy = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    reloadOperationHistory(store, document, {
      meta: { path: '/test', method: 'get' },
      index: 0,
      callback: callbackSpy,
    })

    expect(callbackSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
