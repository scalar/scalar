import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import Ajv2020 from 'ajv/dist/2020.js'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { mockAnyResponse } from './mock-any-response'

const operation = (mediaType: string, content: unknown): OpenAPIV3_1.OperationObject =>
  ({
    responses: {
      '200': { description: 'OK', content: { [mediaType]: content } },
    },
  }) as OpenAPIV3_1.OperationObject
const person = {
  type: 'object',
  xml: { name: 'person' },
  properties: {
    id: { type: 'integer', example: 7, xml: { attribute: true } },
    secret: { type: 'string', example: 'hidden', writeOnly: true },
  },
}

describe('mock-any-response', () => {
  it.each([
    { dialect: undefined, expected: '2\n1\n1\n' },
    { dialect: 'https://example.com/unsupported', expected: '1\n1\n1\n' },
  ])('keeps document dialect context for streaming responses: $dialect', async ({ dialect, expected }) => {
    const schema = { type: 'array', minItems: 3, maxItems: 3, contains: { const: 2 }, maxContains: 1 }
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(
        c,
        operation('application/x-ndjson', { schema, itemSchema: { type: 'integer' } }),
        '3.2.0',
        dialect,
      ),
    )
    expect(await (await app.request('/')).text()).toBe(expected)
  })

  it.each([false, true])('sends arrays satisfying the complete contains schema (unique: %s)', async (uniqueItems) => {
    const schema = {
      type: 'array',
      items: { type: 'integer' },
      minItems: 3,
      maxItems: 3,
      contains: { const: 2 },
      minContains: 1,
      maxContains: 1,
      uniqueItems,
    }
    const app = new Hono().get('/', (c) => mockAnyResponse(c, operation('application/json', { schema }), '3.1.0'))
    const response = await app.request('/')
    const value = await response.json()
    const validate = new Ajv2020({ strict: false }).compile(schema)
    expect(response.status).toBe(200)
    expect({ valid: validate(value), errors: validate.errors }).toStrictEqual({ valid: true, errors: null })
    expect(value).toStrictEqual(uniqueItems ? [2, 1, 3] : [2, 1, 1])
  })

  it.each([
    { version: '3.0.4', dialect: undefined, expected: [1, 1, 1] },
    { version: '3.1.0', dialect: undefined, expected: [2, 1, 1] },
    { version: '3.2.0', dialect: 'https://example.com/unknown-dialect', expected: [1, 1, 1] },
  ])('uses the response document dialect for $version/$dialect', async ({ version, dialect, expected }) => {
    const schema = {
      type: 'array',
      items: { type: 'integer' },
      minItems: 3,
      maxItems: 3,
      contains: { const: 2 },
      maxContains: 1,
    }
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(c, operation('application/json', { schema }), version, dialect),
    )
    expect(await (await app.request('/')).json()).toStrictEqual(expected)
  })

  it('preserves transport headers set by middleware when the document declares different values', async () => {
    const app = new Hono()
      .use((c, next) => {
        c.header('Content-Length', '0')
        c.header('Content-Encoding', 'identity')
        c.header('Content-Type', 'text/plain')
        return next()
      })
      .get('/', (c) =>
        mockAnyResponse(c, {
          responses: {
            '200': {
              description: 'Empty response',
              headers: {
                'CONTENT-LENGTH': { schema: { type: 'integer', example: 1024 } },
                'CONTENT-ENCODING': { schema: { type: 'string', example: 'gzip' } },
                'CONTENT-TYPE': { schema: { type: 'string', example: 'application/json' } },
              },
            },
          },
        }),
      )

    const response = await app.request('/')
    expect(await response.text()).toBe('')
    expect(response.headers.get('content-length')).toBe('0')
    expect(response.headers.get('content-encoding')).toBe('identity')
    expect(response.headers.get('content-type')).toBe('text/plain')
  })

  it('sends generated arrays within their declared bounds', async () => {
    const schema = {
      type: 'object',
      properties: {
        coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
        empty: { type: 'array', items: { type: 'number' }, maxItems: 0 },
      },
    }
    const app = new Hono().get('/', (c) => mockAnyResponse(c, operation('application/json', { schema })))
    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ coordinates: [1, 1], empty: [] })
  })

  it.each([
    [{ $ref: '#/components/schemas/Missing' }, {}, 'unresolved-reference'],
    [
      { type: 'array', xml: { name: 'items', wrapped: true }, items: { type: 'string', xml: { name: 'item' } } },
      Array.from({ length: 10_001 }, () => 'value'),
      'limit-exceeded',
    ],
  ])('exposes XML generation errors in response headers: %s', async (schema, dataValue, code) => {
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(c, operation('application/xml', { schema, examples: { supplied: { dataValue } } })),
    )
    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Scalar-XML-Error')).toBe(code)
    expect(await response.text()).toBe('')
  })

  it.each(['application/xml', 'text/xml', 'application/problem+xml'])(
    'sends schema-aware XML for %s',
    async (mediaType) => {
      const app = new Hono().get('/', (c) => mockAnyResponse(c, operation(mediaType, { schema: person })))
      const response = await app.request('/')
      expect(response.status).toBe(200)
      expect(response.headers.get('X-Scalar-XML-Error')).toBeNull()
      expect(response.headers.get('Content-Type')).toBe(mediaType)
      expect(await response.text()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<person id="7"/>')
    },
  )

  it('applies schema metadata to explicit data examples', async () => {
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(
        c,
        operation('application/xml', { schema: person, examples: { supplied: { dataValue: { id: 0 } } } }),
      ),
    )
    const response = await app.request('/', { headers: { Prefer: 'example=supplied' } })
    expect(await response.text()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<person id="0"/>')
  })

  it('preserves serialized XML examples exactly', async () => {
    const raw = '<person id="9" />\n'
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(
        c,
        operation('application/xml', {
          schema: person,
          examples: { supplied: { serializedValue: raw, dataValue: { id: 0 } } },
        }),
      ),
    )
    const response = await app.request('/', { headers: { Prefer: 'example=supplied' } })
    expect(await response.text()).toBe(raw)
  })

  it('serializes a schema string example as element text', async () => {
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(
        c,
        operation('application/xml', { schema: { type: 'string', xml: { name: 'message' }, example: '<hello/>' } }),
      ),
    )
    const response = await app.request('/')
    expect(await response.text()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<message>&lt;hello/&gt;</message>')
  })
  it.each([
    [{ dataValue: '{"id":1}' }, undefined, '"{\\"id\\":1}"'],
    [{ serializedValue: '"hello"' }, { type: 'string' }, '"hello"'],
    [{ dataValue: 'text' }, { type: 'array', items: { type: 'string' } }, '"text"'],
  ])('preserves explicit JSON example provenance %j', async (example, schema, expected) => {
    const app = new Hono().get('/', (c) =>
      mockAnyResponse(c, operation('application/json', { schema, examples: { supplied: example } })),
    )
    expect(await (await app.request('/')).text()).toBe(expected)
  })
})
