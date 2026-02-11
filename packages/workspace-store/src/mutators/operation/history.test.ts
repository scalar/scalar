import { assert, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { addResponseToHistory, reloadOperationHistory } from '@/mutators/operation/history'
import type { WorkspaceDocument } from '@/schemas'

const createDocument = (initial?: Partial<WorkspaceDocument>): WorkspaceDocument => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

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
