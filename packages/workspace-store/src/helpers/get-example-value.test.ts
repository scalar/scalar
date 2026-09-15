import { describe, expect, it } from 'vitest'

import { updateOperationRequestBodyExample } from '@/mutators/operation/body'
import { buildRequestBody } from '@/request-example/builder/body/build-request-body'
import { getExampleFromBody } from '@/request-example/builder/body/get-request-body-example'
import type { ExampleObject, OpenApiDocument, RequestBodyObject } from '@/schemas/v3.2/strict/openapi-document'

import { getExampleValue, getJsonExampleText } from './get-example-value'
import { getResolvedRef } from './get-resolved-ref'

describe('get-example-value', () => {
  it.each([false, 0, null, '', { id: 1 }])('selects structured data without losing %j', (value) => {
    expect(getExampleValue({ dataValue: value, value: 'legacy' })).toStrictEqual({ source: 'data', value })
  })

  it('prefers serialized content without mutating the authored example', () => {
    const example = { serializedValue: '', dataValue: false, value: 'legacy' }
    expect(getExampleValue(example)).toStrictEqual({ source: 'serialized', value: '' })
    expect(example).toStrictEqual({ serializedValue: '', dataValue: false, value: 'legacy' })
  })

  it('resolves referenced examples and preserves legacy values', () => {
    expect(
      getExampleValue({ $ref: '#/components/examples/message', '$ref-value': { dataValue: 'hello' } }),
    ).toStrictEqual({
      source: 'data',
      value: 'hello',
    })
    expect(getExampleValue({ value: false })).toStrictEqual({ source: 'value', value: false })
    expect(getExampleValue({ externalValue: '/example.json' })).toBeUndefined()
    expect(getExampleValue(undefined)).toBeUndefined()
  })

  it.each(['application/json', 'application/problem+json; charset=utf-8'])(
    'quotes structured strings for %s',
    (type) => {
      expect(getJsonExampleText(getExampleValue({ dataValue: '{"id":1}' }), type)).toBe('"{\\"id\\":1}"')
      expect(getJsonExampleText(getExampleValue({ serializedValue: ' { "id": 1 }\n' }), type)).toBe(' { "id": 1 }\n')
      expect(getJsonExampleText(getExampleValue({ dataValue: false }), type)).toBe('false')
      expect(getJsonExampleText(getExampleValue({ dataValue: null }), type)).toBe('null')
    },
  )

  it('leaves format-specific encoding to its consumer', () => {
    expect(getJsonExampleText(getExampleValue({ dataValue: { id: 1 } }), 'application/xml')).toBeUndefined()
    expect(getJsonExampleText(getExampleValue({ serializedValue: '<id>1</id>' }), 'application/xml')).toBe('<id>1</id>')
    expect(getJsonExampleText(getExampleValue({ value: 'legacy' }), 'application/json')).toBeUndefined()
  })

  it.each([
    [{ dataValue: 'hello' }, '"hello"'],
    [{ dataValue: false }, 'false'],
    [{ dataValue: null }, 'null'],
    [{ dataValue: 0 }, '0'],
    [{ serializedValue: '  { "id": 1 }\n', dataValue: { id: 2 } }, '  { "id": 1 }\n'],
    [{ serializedValue: '' }, ''],
  ] satisfies [ExampleObject, string][])('sends the selected body example %j', (example, expected) => {
    const body: RequestBodyObject = { content: { 'application/json': { examples: { selected: example } } } }
    expect(buildRequestBody(body, 'selected')).toStrictEqual({
      mode: 'raw',
      value: expected,
      contentType: 'application/json',
    })
  })

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
})
