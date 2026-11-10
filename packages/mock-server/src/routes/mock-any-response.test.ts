import type { OpenAPIV3_1 } from '@scalar/openapi-types'
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
