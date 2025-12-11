import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'

import {
  addOperationParameter,
  addOperationRequestBodyFormRow,
  createOperation,
  deleteAllOperationParameters,
  deleteOperation,
  deleteOperationExample,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  updateOperationParameter,
  updateOperationPathMethod,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormRow,
  updateOperationSummary,
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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users' },
        payload: { method: 'put', path: '/users' },
        callback: (_status) => {},
      },
      (_status) => {},
    )
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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/products' },
        payload: { method: 'patch', path: '/products' },
        callback: (_status) => {},
      },
      (_status) => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/items' },
        payload: { method: 'post', path: '/items' },
        callback: (status) => {
          callbackResult = status
        },
      },
      (status) => {
        callbackResult = status
      },
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users' },
        payload: { method: 'get', path: '/api/users' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'post', path: '/posts' },
        payload: { method: 'post', path: '/api/v2/posts' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users' },
        payload: { method: 'get', path: '/api/users' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users/{id}' },
        payload: { method: 'get', path: '/events/{id}' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users/{id}/{limit}' },
        payload: { method: 'get', path: '/events/{limit}/{id}' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users/{id}' },
        payload: { method: 'get', path: '/users/{limit}' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/users/{id}' },
        payload: { method: 'get', path: '/users/events/{limit}' },
        callback: () => {},
      },
      () => {},
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/items' },
        payload: { method: 'get', path: '/api/items' },
        callback: (status) => {
          callbackResult = status
        },
      },
      (status) => {
        callbackResult = status
      },
    )

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

    updateOperationPathMethod(
      document,
      store,
      {
        meta: { method: 'get', path: '/items' },
        payload: { method: 'get', path: '/api/items' },
        callback: (status) => {
          callbackResult = status
        },
      },
      (status) => {
        callbackResult = status
      },
    )

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
})

describe('addOperationParameter', () => {
  it('adds a query parameter with example and enabled state', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [{ name: 'X-Trace', in: 'header' }],
          },
        },
      },
    })

    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'john', isDisabled: false },
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

    addOperationParameter(document, {
      type: 'path',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'id', value: '123', isDisabled: true },
    })

    const op = getResolvedRef(document.paths?.['/users/{id}']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(1)
    const only = params[0]
    expect(only).toMatchObject({ name: 'id', in: 'path', required: true })
    assert(only && 'examples' in only && only.examples)
    expect(getResolvedRef(only.examples?.default)?.value).toBe('123')
    expect(getResolvedRef(only.examples?.default)?.['x-disabled']).toBe(true)
  })

  it('no-ops when document is null', () => {
    expect(() =>
      addOperationParameter(null, {
        type: 'query',
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
        payload: { key: 'q', value: 'x', isDisabled: false },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/missing': {},
      },
    })

    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/missing', exampleKey: 'default' },
      payload: { key: 'q', value: 'x', isDisabled: false },
    })

    expect(document.paths?.['/missing']).toEqual({})
  })
})

describe('updateOperationParameter', () => {
  it('updates the N-th query parameter by type index: name, value, enabled', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {
            parameters: [{ name: 'X-Trace', in: 'header' }],
          },
        },
      },
    })

    // Add two query params so we can target index 1 for type 'query'
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })

    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'p', value: 'two', isDisabled: false },
    })

    updateOperationParameter(document, {
      type: 'query',
      index: 1,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isDisabled: false },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    // Header unchanged
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    // First query unchanged
    const firstQuery = params[1]
    assert(firstQuery && 'examples' in firstQuery && firstQuery.examples)
    expect(firstQuery).toMatchObject({ name: 'q', in: 'query', required: false })
    expect(getResolvedRef(firstQuery.examples.default)?.value).toBe('one')
    expect(getResolvedRef(firstQuery.examples.default)?.['x-disabled']).toBe(false)
    // Second query updated
    const secondQuery = params[2]
    assert(secondQuery && 'examples' in secondQuery && secondQuery.examples)
    expect(secondQuery).toMatchObject({ name: 'page', in: 'query', required: false })
    expect(getResolvedRef(secondQuery.examples.default)?.value).toBe('2')
    expect(getResolvedRef(secondQuery.examples.default)?.['x-disabled']).toBe(false)
  })

  it('preserves previous enabled state when isEnabled is undefined', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {},
        },
      },
    })

    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })

    updateOperationParameter(document, {
      type: 'query',
      index: 0,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { value: 'ONE' },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const param = getResolvedRef((op.parameters ?? [])[0])
    assert(param && 'examples' in param && param.examples)
    expect(getResolvedRef(param.examples.default)?.value).toBe('ONE')
    // was enabled -> x-disabled false remains
    expect(getResolvedRef(param.examples.default)?.['x-disabled']).toBe(false)
  })

  it('updates name and example even if exampleKey is missing', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {},
        },
      },
    })

    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })

    updateOperationParameter(document, {
      type: 'query',
      index: 0,
      meta: { method: 'get', path: '/search', exampleKey: 'other' },
      payload: { key: 'query', value: 'new value', isDisabled: false },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const param = getResolvedRef((op.parameters ?? [])[0])
    // Name should update
    expect(param?.name).toBe('query')
    // But no new example for 'other' should be created; default remains unchanged
    assert(param && 'examples' in param && param.examples)
    expect(getResolvedRef(param.examples.other)?.value).toBe('new value')
    expect(getResolvedRef(param.examples.default)?.value).toBe('one')
  })

  it('only updates parameters of the specified type', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {},
        },
      },
    })

    addOperationParameter(document, {
      type: 'header',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'abc', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })

    // index 0 for type 'query' refers to the second element in the raw array
    updateOperationParameter(document, {
      type: 'query',
      index: 0,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'query', value: '1' },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    const queryParam = params[1]
    assert(queryParam && 'examples' in queryParam)
    expect(queryParam?.name).toBe('query')
    expect(getResolvedRef(queryParam?.examples?.default as any)?.value).toBe('1')
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationParameter(null, {
        type: 'query',
        index: 0,
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
        payload: { key: 'q' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation or parameter does not exist', () => {
    const document = createDocument({
      paths: {
        '/search': {},
      },
    })

    updateOperationParameter(document, {
      type: 'query',
      index: 0,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q' },
    })

    expect(document.paths?.['/search']).toEqual({})
  })
})

describe('deleteOperationParameter', () => {
  it('deletes the N-th parameter within the filtered type view', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {},
        },
      },
    })

    // Add a header and two query params (order matters)
    addOperationParameter(document, {
      type: 'header',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'a', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isDisabled: false },
    })

    // Delete the second query (index 1 within filtered query params)
    deleteOperationParameter(document, {
      type: 'query',
      index: 1,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const params = (op.parameters ?? []).map((p) => getResolvedRef(p))
    expect(params.length).toBe(2)
    expect(params[0]).toMatchObject({ name: 'X-Trace', in: 'header' })
    expect(params[1]).toMatchObject({ name: 'q', in: 'query' })
  })

  it('no-ops when document is null', () => {
    expect(() =>
      deleteOperationParameter(null, {
        type: 'query',
        index: 0,
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation or parameter does not exist', () => {
    const document = createDocument({
      paths: {
        '/search': {},
      },
    })

    deleteOperationParameter(document, {
      type: 'query',
      index: 5,
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
          get: {},
        },
      },
    })

    // Add a mix of parameter types
    addOperationParameter(document, {
      type: 'header',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'a', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'query',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isDisabled: false },
    })
    addOperationParameter(document, {
      type: 'path',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'id', value: '123', isDisabled: false },
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
      payload: { value: '{"name":"Ada"}' },
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
      payload: { value: 'v1' },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: { value: 'v2' },
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
      payload: { value: 'one' },
    })

    updateOperationRequestBodyExample(document, {
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'B' },
      payload: { value: 'two' },
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
        payload: { value: 'x' },
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
      payload: { value: 'x' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})

describe('addOperationRequestBodyFormRow', () => {
  it('initializes example value as array when missing and appends the first row', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['multipart/form-data']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    const ex = getResolvedRef(examples.default)
    assert(ex && Array.isArray(ex.value))
    expect(ex.value).toEqual([{ name: 'file', value: expect.any(File), isDisabled: false }])
  })

  it('appends a new row when example value is already an array', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })
    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'description', value: 'Profile picture' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const ex = getResolvedRef(rb.content?.['multipart/form-data']?.examples?.default)
    assert(ex && Array.isArray(ex.value))
    expect(ex.value).toHaveLength(2)
    expect(ex.value[1]).toEqual({ name: 'description', value: 'Profile picture', isDisabled: false })
  })

  it('no-ops when document is null', () => {
    expect(() =>
      addOperationRequestBodyFormRow(null, {
        contentType: 'multipart/form-data',
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
        payload: { key: 'file', value: new File(['x'], 'a.txt') },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({ paths: { '/upload': {} } })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})

describe('updateOperationRequestBodyFormRow', () => {
  it('updates an existing row by index; undefined value clears to undefined', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })
    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'description', value: 'Profile picture' },
    })

    updateOperationRequestBodyFormRow(document, {
      index: 1,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'desc', value: undefined },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb2 = getResolvedRef(op.requestBody)
    const ex = getResolvedRef(rb2?.content?.['multipart/form-data']?.examples?.default)
    assert(ex && Array.isArray(ex.value))
    expect(ex.value[1]).toEqual({ name: 'desc', value: undefined, isDisabled: false })
  })

  it('no-ops when content type or example array is missing', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    // No requestBody/content/examples present
    updateOperationRequestBodyFormRow(document, {
      index: 0,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'x', value: 'y' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    expect(op.requestBody).toEqual({ content: {} })
  })
})

describe('deleteOperationRequestBodyFormRow', () => {
  it('deletes a row by index; removes example when last row removed', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })

    deleteOperationRequestBodyFormRow(document, {
      index: 0,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb3 = getResolvedRef(op.requestBody)
    const examples = rb3?.content?.['multipart/form-data']?.examples
    expect(examples?.default).toBeUndefined()
  })

  it('deletes the correct row and keeps others intact', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'a', value: '1' },
    })
    addOperationRequestBodyFormRow(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'b', value: '2' },
    })

    deleteOperationRequestBodyFormRow(document, {
      index: 0,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb4 = getResolvedRef(op.requestBody)
    const ex = getResolvedRef(rb4?.content?.['multipart/form-data']?.examples?.default)
    assert(ex && Array.isArray(ex.value))
    expect(ex.value).toHaveLength(1)
    expect(ex.value[0]).toEqual({ name: 'b', value: '2', isDisabled: false })
  })

  it('no-ops when document is null or operation does not exist', () => {
    expect(() =>
      deleteOperationRequestBodyFormRow(null, {
        index: 0,
        contentType: 'multipart/form-data',
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      }),
    ).not.toThrow()

    const document = createDocument({ paths: { '/upload': {} } })

    deleteOperationRequestBodyFormRow(document, {
      index: 0,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})

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
