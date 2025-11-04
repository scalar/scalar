import { assert, describe, expect, it } from 'vitest'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'

import {
  addOperationParameter,
  addOperationRequestBodyFormRow,
  deleteAllOperationParameters,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  updateOperationMethodDraft,
  updateOperationParameter,
  updateOperationPathDraft,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormRow,
  updateOperationSummary,
} from './operation'

function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
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

    updateOperationSummary({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { summary: 'New summary' },
    })

    expect(document.paths?.['/users']?.get?.summary).toBe('New summary')
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationSummary({
        document: null,
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

    updateOperationSummary({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { summary: 'New summary' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})

describe('updateOperationMethodDraft', () => {
  it('sets x-scalar-method on existing operation and preserves original slot', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            responses: {
              '200': { description: 'ok' },
            },
          },
        },
      },
    })

    updateOperationMethodDraft({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { method: 'post' },
    })
    const opWithExt = getResolvedRef(document.paths?.['/users']?.get)
    assert(opWithExt)
    expect(opWithExt['x-scalar-method']).toBe('post')
    expect(document.paths?.['/users']?.get).toBeDefined()
    expect(document.paths?.['/users']?.post).toBeUndefined()
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationMethodDraft({
        document: null,
        meta: { method: 'get', path: '/users' },
        payload: { method: 'post' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationMethodDraft({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { method: 'post' },
    })

    expect(document.paths?.['/users']).toEqual({})
  })
})

describe('updateOperationPathDraft', () => {
  it('sets x-scalar-path and syncs path parameters from payload.path', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {},
        },
      },
    })

    updateOperationPathDraft({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { path: '/users/{id}/posts/{postId}' },
    })

    const op = getResolvedRef(document.paths?.['/users']?.get)
    assert(op)
    expect(op['x-scalar-path']).toBe('/users/{id}/posts/{postId}')

    const params = (op.parameters ?? []).map((p: unknown) => getResolvedRef(p as any))
    expect(params).toEqual([
      { name: 'id', in: 'path', required: true },
      { name: 'postId', in: 'path', required: true },
    ])
  })

  it('preserves non-path parameters and replaces path parameters based on new path', () => {
    const document = createDocument({
      paths: {
        '/users': {
          get: {
            parameters: [
              { name: 'q', in: 'query' },
              { name: 'old', in: 'path', required: true },
            ],
          },
        },
      },
    })

    updateOperationPathDraft({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { path: '/users/{id}' },
    })

    const op = getResolvedRef(document.paths?.['/users']?.get)
    assert(op)
    expect(op['x-scalar-path']).toBe('/users/{id}')

    const params = (op.parameters ?? []).map((p: unknown) => getResolvedRef(p as any))
    expect(params).toEqual([
      { name: 'q', in: 'query' },
      { name: 'id', in: 'path', required: true },
    ])
  })

  it('no-ops when document is null', () => {
    expect(() =>
      updateOperationPathDraft({
        document: null,
        meta: { method: 'get', path: '/users' },
        payload: { path: '/users/{id}' },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/users': {},
      },
    })

    updateOperationPathDraft({
      document,
      meta: { method: 'get', path: '/users' },
      payload: { path: '/users/{id}' },
    })

    expect(document.paths?.['/users']).toEqual({})
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

    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'john', isEnabled: true },
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

    addOperationParameter({
      document,
      type: 'path',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'id', value: '123', isEnabled: false },
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
      addOperationParameter({
        document: null,
        type: 'query',
        meta: { method: 'get', path: '/search', exampleKey: 'default' },
        payload: { key: 'q', value: 'x', isEnabled: true },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({
      paths: {
        '/missing': {},
      },
    })

    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/missing', exampleKey: 'default' },
      payload: { key: 'q', value: 'x', isEnabled: true },
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
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })

    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'p', value: 'two', isEnabled: false },
    })

    updateOperationParameter({
      document,
      type: 'query',
      index: 1,
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isEnabled: true },
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

    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })

    updateOperationParameter({
      document,
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

  it('updates name even if exampleKey is missing; does not create new example', () => {
    const document = createDocument({
      paths: {
        '/search': {
          get: {},
        },
      },
    })

    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })

    updateOperationParameter({
      document,
      type: 'query',
      index: 0,
      meta: { method: 'get', path: '/search', exampleKey: 'other' },
      payload: { key: 'query', value: 'ignored', isEnabled: false },
    })

    const op = getResolvedRef(document.paths?.['/search']?.get)
    assert(op)
    const param = getResolvedRef((op.parameters ?? [])[0])
    // Name should update
    expect(param?.name).toBe('query')
    // But no new example for 'other' should be created; default remains unchanged
    assert(param && 'examples' in param && param.examples)
    expect(param.examples.other).toBeUndefined()
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

    addOperationParameter({
      document,
      type: 'header',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'abc', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })

    // index 0 for type 'query' refers to the second element in the raw array
    updateOperationParameter({
      document,
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
      updateOperationParameter({
        document: null,
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

    updateOperationParameter({
      document,
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
    addOperationParameter({
      document,
      type: 'header',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'a', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/search', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isEnabled: true },
    })

    // Delete the second query (index 1 within filtered query params)
    deleteOperationParameter({
      document,
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
      deleteOperationParameter({
        document: null,
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

    deleteOperationParameter({
      document,
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
    addOperationParameter({
      document,
      type: 'header',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'X-Trace', value: 'a', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'q', value: 'one', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'query',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'page', value: '2', isEnabled: true },
    })
    addOperationParameter({
      document,
      type: 'path',
      meta: { method: 'get', path: '/users/{id}', exampleKey: 'default' },
      payload: { key: 'id', value: '123', isEnabled: true },
    })

    deleteAllOperationParameters({
      document,
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
      deleteAllOperationParameters({
        document: null,
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

    deleteAllOperationParameters({
      document,
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

    updateOperationRequestBodyContentType({
      document,
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

    updateOperationRequestBodyContentType({
      document,
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
      updateOperationRequestBodyContentType({
        document: null,
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

    updateOperationRequestBodyContentType({
      document,
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

    updateOperationRequestBodyExample({
      document,
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

    updateOperationRequestBodyExample({
      document,
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'default' },
      payload: { value: 'v1' },
    })

    updateOperationRequestBodyExample({
      document,
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

    updateOperationRequestBodyExample({
      document,
      contentType: 'application/json',
      meta: { method: 'post', path: '/users', exampleKey: 'A' },
      payload: { value: 'one' },
    })

    updateOperationRequestBodyExample({
      document,
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
      updateOperationRequestBodyExample({
        document: null,
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

    updateOperationRequestBodyExample({
      document,
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

    addOperationRequestBodyFormRow({
      document,
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
    expect(ex.value).toEqual([{ name: 'file', value: expect.any(File) }])
  })

  it('appends a new row when example value is already an array', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })
    addOperationRequestBodyFormRow({
      document,
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
    expect(ex.value[1]).toEqual({ name: 'description', value: 'Profile picture' })
  })

  it('no-ops when document is null', () => {
    expect(() =>
      addOperationRequestBodyFormRow({
        document: null,
        contentType: 'multipart/form-data',
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
        payload: { key: 'file', value: new File(['x'], 'a.txt') },
      }),
    ).not.toThrow()
  })

  it('no-ops when operation does not exist', () => {
    const document = createDocument({ paths: { '/upload': {} } })

    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})

describe('updateOperationRequestBodyFormRow', () => {
  it('updates an existing row by index; null value clears to undefined', () => {
    const document = createDocument({
      paths: {
        '/upload': {
          post: {},
        },
      },
    })

    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })
    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'description', value: 'Profile picture' },
    })

    updateOperationRequestBodyFormRow({
      document,
      index: 1,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'desc', value: null },
    })

    const op = getResolvedRef(document.paths?.['/upload']?.post)
    assert(op)
    const rb2 = getResolvedRef(op.requestBody)
    const ex = getResolvedRef(rb2?.content?.['multipart/form-data']?.examples?.default)
    assert(ex && Array.isArray(ex.value))
    expect(ex.value[1]).toEqual({ name: 'desc', value: undefined })
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
    updateOperationRequestBodyFormRow({
      document,
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

    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'file', value: new File(['x'], 'a.txt') },
    })

    deleteOperationRequestBodyFormRow({
      document,
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

    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'a', value: '1' },
    })
    addOperationRequestBodyFormRow({
      document,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload: { key: 'b', value: '2' },
    })

    deleteOperationRequestBodyFormRow({
      document,
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
    expect(ex.value[0]).toEqual({ name: 'b', value: '2' })
  })

  it('no-ops when document is null or operation does not exist', () => {
    expect(() =>
      deleteOperationRequestBodyFormRow({
        document: null,
        index: 0,
        contentType: 'multipart/form-data',
        meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      }),
    ).not.toThrow()

    const document = createDocument({ paths: { '/upload': {} } })

    deleteOperationRequestBodyFormRow({
      document,
      index: 0,
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
    })

    expect(document.paths?.['/upload']).toEqual({})
  })
})
