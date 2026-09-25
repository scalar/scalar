import { assert, describe, expect, it } from 'vitest'

import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import {
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormValue,
} from '@/mutators/operation/body'
import { buildRequestBody } from '@/request-example/builder/body/build-request-body'
import { getExampleFromBody } from '@/request-example/builder/body/get-request-body-example'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'

const createDocument = (initial?: Partial<OpenApiDocument>): OpenApiDocument => {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/upload'], 'post'))
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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/upload'], 'post'))
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
  it('replaces original example fields when a user clears the body', () => {
    const document: OpenApiDocument = {
      openapi: '3.2.0',
      'x-scalar-original-document-hash': '',
      info: { title: 'Example', version: '1' },
      paths: {
        '/': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  examples: {
                    selected: {
                      serializedValue: 'old',
                      dataValue: false,
                      externalValue: '/old.json',
                      summary: 'Keep title',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    updateOperationRequestBodyExample(document, {
      meta: { path: '/', method: 'post', exampleKey: 'selected' },
      contentType: 'application/json',
      payload: '',
    })
    const body = getResolvedRef(getResolvedRef(getResolvedRef(document.paths?.['/'])?.post)?.requestBody)
    expect(getExampleFromBody(body!, 'application/json', 'selected')).toStrictEqual({
      summary: 'Keep title',
      value: '',
    })
    expect(buildRequestBody(body, 'selected')).toStrictEqual({ mode: 'raw', value: '' })
  })

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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/users'], 'post'))
    assert(op)
    const rb = getResolvedRef(op.requestBody)
    assert(rb)
    const media = rb.content?.['application/json']
    assert(media)
    const examples = getResolvedRef(media.examples)
    assert(examples)
    expect(getResolvedRef(examples.default)?.value).toBe('{"name":"Ada"}')
  })

  it.each([{ serializedValue: '<message>original</message>' }, { dataValue: 'original' }])(
    'replaces XML source fields when editing or clearing an example: %j',
    (original) => {
      const document = createDocument({
        paths: {
          '/messages': {
            post: {
              requestBody: {
                content: {
                  'application/xml': {
                    schema: { type: 'string', xml: { name: 'message' } },
                    examples: {
                      default: { ...original, externalValue: 'https://example.com/original.xml' },
                    },
                  },
                },
              },
            },
          },
        },
      })
      for (const payload of ['<message>edited</message>', '']) {
        updateOperationRequestBodyExample(document, {
          contentType: 'application/xml',
          meta: { method: 'post', path: '/messages', exampleKey: 'default' },
          payload,
        })
        const operation = getResolvedRef(getPathItemOperation(document.paths?.['/messages'], 'post'))
        const requestBody = getResolvedRef(operation?.requestBody)
        assert(requestBody)
        expect(getExampleFromBody(requestBody, 'application/xml', 'default')?.value).toBe(payload)
        expect(getResolvedRef(requestBody.content?.['application/xml']?.examples?.default)).toStrictEqual({
          value: payload,
        })
      }
    },
  )

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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/users'], 'post'))
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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/users'], 'post'))
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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/users'], 'post'))
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

describe('updateOperationRequestBodyFormValue', () => {
  it('replaces external and OpenAPI 3.2 example sources after an explicit form edit', () => {
    const example = {
      externalValue: '/examples/body.json',
      dataValue: { field: 'original' },
      serializedValue: 'field=original',
      summary: 'Authored example',
    }
    const document = createDocument({
      paths: {
        '/upload': {
          post: {
            requestBody: {
              content: { 'multipart/form-data': { examples: { default: example } } },
            },
          },
        },
      },
    })
    const payload = [{ name: 'field', value: 'edited', isDisabled: false }]
    updateOperationRequestBodyFormValue(document, {
      contentType: 'multipart/form-data',
      meta: { method: 'post', path: '/upload', exampleKey: 'default' },
      payload,
    })
    expect(example).toStrictEqual({ summary: 'Authored example', value: payload })
  })

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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/upload'], 'post'))
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

    const op = getResolvedRef(getPathItemOperation(document.paths?.['/upload'], 'post'))
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
