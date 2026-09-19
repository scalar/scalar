import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { mockHandlerResponse } from './mock-handler-response'

describe('mock-handler-response', () => {
  it.each([
    [{ serializedValue: '{"id":1}' }, undefined, '{"id":1}'],
    [{ serializedValue: '"hello"' }, { type: 'string' }, '"hello"'],
    [{ dataValue: '{"id":1}' }, undefined, '"{\\"id\\":1}"'],
    [{ dataValue: 'text' }, { type: 'array', items: { type: 'string' } }, '"text"'],
  ])(
    'retains explicit example provenance when the handler returns undefined: %j',
    async (example, schema, expected) => {
      const operation = {
        'x-handler': 'return undefined;',
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema, examples: { supplied: example } } } },
        },
      } as OpenAPIV3_1.OperationObject
      const app = new Hono().get('/', (c) => mockHandlerResponse(c, operation))
      const response = await app.request('/')
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(await response.text()).toBe(expected)
    },
  )
})
