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
  it.each(['application/xml', 'text/xml', 'application/problem+xml'])(
    'sends schema-aware XML for %s',
    async (mediaType) => {
      const app = new Hono().get('/', (c) => mockAnyResponse(c, operation(mediaType, { schema: person })))
      const response = await app.request('/')
      expect(response.status).toBe(200)
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
