import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import {
  getQuerystringParameter,
  serializeQuerystringParameter,
} from '@scalar/workspace-store/helpers/querystring-parameter'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { ParameterObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'
import { parseQuerystringParameter } from './querystring-parameter'

type QueryMediaType = NonNullable<OpenAPIV3_2.ParameterObject['content']>[string]

type Case = {
  name: string
  contentType?: string
  value: unknown
  schema: NonNullable<QueryMediaType['schema']>
  encoding?: QueryMediaType['encoding']
  wire?: string
}
const stringArray = { type: 'array', items: { type: 'string' } } as const
const cases: Case[] = [
  {
    name: 'JSON with reserved characters and native types',
    contentType: 'application/json',
    value: { text: 'a&b + 100%', number: 2, flag: false },
    schema: { type: 'object' },
  },
  {
    name: 'parameterized structured JSON suffix',
    contentType: 'Application/Query+JSON; charset=utf-8',
    value: ['a b', null, 1],
    schema: { type: 'array' },
  },
  { name: 'opaque text', contentType: 'text/plain', value: '$.items[?@.id<2] & +%', schema: { type: 'string' } },
  {
    name: 'default form arrays and JSON object properties',
    value: { tags: ['a b', 'c+d'], filter: { active: true } },
    schema: { type: 'object', properties: { tags: stringArray, filter: { type: 'object' } } },
  },
  ...(['form', 'pipeDelimited', 'spaceDelimited'] as const).map(
    (style): Case => ({
      name: `${style} array`,
      value: { tags: ['red', 'blue'] },
      schema: { type: 'object', properties: { tags: stringArray } },
      encoding: { tags: { style, explode: false } },
    }),
  ),
  {
    name: 'deepObject',
    value: { filter: { first: 'a b', second: 'c+d' } },
    schema: {
      type: 'object',
      properties: { filter: { type: 'object', properties: { first: { type: 'string' }, second: { type: 'string' } } } },
    },
    encoding: { filter: { style: 'deepObject' } },
  },
  {
    name: 'exploded form object',
    value: { filter: { first: 'a b', second: 'c+d' } },
    schema: {
      type: 'object',
      properties: { filter: { type: 'object', properties: { first: { type: 'string' }, second: { type: 'string' } } } },
    },
    encoding: { filter: { style: 'form', explode: true } },
  },
  {
    name: 'JSON encoded string property',
    value: { label: 'a+b' },
    schema: { type: 'object', properties: { label: { type: 'string' } } },
    encoding: { label: { contentType: 'application/json' } },
  },
  {
    name: 'allowReserved safe subset with structural delimiters protected',
    value: { value: '/a:b;@!&=#+?[]' },
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    encoding: { value: { allowReserved: true } },
    wire: 'value=/a:b;@!%26%3D%23%2B%3F%5B%5D',
  },
  {
    name: 'allowReserved false',
    value: { value: '/a:b;@!&=#+?[]' },
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    encoding: { value: { allowReserved: false } },
    wire: 'value=%2Fa%3Ab%3B%40%21%26%3D%23%2B%3F%5B%5D',
  },
]

describe('querystring-roundtrip', () => {
  it.each(cases)(
    'preserves $name from outgoing serialization through mock parsing',
    async ({ contentType = 'application/x-www-form-urlencoded', value, schema, encoding, wire }) => {
      const example: OpenAPIV3_2.ExampleObject = { summary: 'Round-trip value', dataValue: value }
      const parameter: OpenAPIV3_2.ParameterObject = {
        name: 'wholeQuery',
        in: 'querystring',
        required: true,
        content: { [contentType]: { schema, encoding, examples: { default: example } } },
      }
      const outgoing = getQuerystringParameter(coerceValue(ParameterObjectSchema, parameter), 'default')
      expect(outgoing).toBeDefined()
      if (!outgoing) {
        throw new Error('Expected an outgoing whole-query value')
      }
      const query = serializeQuerystringParameter(outgoing)
      if (wire) {
        expect(query).toBe(wire)
      }
      expect(parseQuerystringParameter(`https://example.com/search?${query}`, parameter)).toStrictEqual(value)
      const server = await createMockServer({
        document: {
          openapi: '3.2.0',
          info: { title: 'Round trip', version: '1' },
          paths: {
            '/search': {
              get: {
                parameters: [parameter],
                'x-handler': 'return { query: req.query };',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        },
      })
      const response = await server.request(`/search?${query}`)
      expect(response.status).toBe(200)
      expect(await response.json()).toStrictEqual({ query: value })
    },
  )

  it.each(['%ZZ', '{broken'])(
    'rejects invalid URI-ready JSON %s rather than treating it as data',
    async (serializedValue) => {
      const parameter: OpenAPIV3_2.ParameterObject = {
        name: 'wholeQuery',
        in: 'querystring',
        required: true,
        examples: { default: { serializedValue } },
        content: { 'application/json': { schema: {} } },
      }
      const outgoing = getQuerystringParameter(coerceValue(ParameterObjectSchema, parameter), 'default')
      if (!outgoing) {
        throw new Error('Expected the authored URI-ready value')
      }
      expect(serializeQuerystringParameter(outgoing)).toBe(serializedValue)
      expect(() => parseQuerystringParameter(`https://example.com/search?${serializedValue}`, parameter)).toThrow()
      const server = await createMockServer({
        document: {
          openapi: '3.2.0',
          info: { title: 'Invalid', version: '1' },
          paths: { '/search': { get: { parameters: [parameter], responses: { '200': { description: 'OK' } } } } },
        },
      })
      expect((await server.request(`/search?${serializedValue}`)).status).toBe(422)
    },
  )
})
