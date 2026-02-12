import { assert, describe, expect, it } from 'vitest'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import {
  deleteAllOperationParameters,
  deleteOperationParameter,
  updateOperationExtraParameters,
  upsertOperationParameter,
} from '@/mutators/operation/parameters'
import type { WorkspaceDocument } from '@/schemas'

const createDocument = (initial?: Partial<WorkspaceDocument>): WorkspaceDocument => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

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

  it('updates a content-type parameter with examples', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            parameters: [
              {
                name: 'message',
                in: 'query',
                required: true,
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                  },
                },
              },
            ],
          },
        },
      },
    })

    const op = getResolvedRef(document.paths?.['/users']?.get)
    assert(op)
    const param = getResolvedRef(op.parameters?.[0])
    assert(param)

    upsertOperationParameter(document, {
      type: 'query',
      originalParameter: param,
      meta: { method: 'get', path: '/users', exampleKey: 'default' },
      payload: { name: 'message', value: '{"id": 1}', isDisabled: false },
    })

    assert('examples' in param && param.examples)
    expect(getResolvedRef(param.examples.default)?.value).toBe('{"id": 1}')
    expect(getResolvedRef(param.examples.default)?.['x-disabled']).toBe(false)
    // Content property should remain untouched
    assert('content' in param && param.content)
    expect(param.content['application/json']).toBeDefined()
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
