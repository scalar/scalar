import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'
import { parseQuerystringParameter } from './querystring-parameter'

const parameter: OpenAPIV3_2.ParameterObject = {
  name: 'search',
  in: 'querystring',
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { limit: { type: 'integer' } },
        required: ['limit'],
        additionalProperties: false,
      },
    },
  },
}

const documentWith = (
  query: OpenAPIV3_2.ParameterObject,
): OpenAPIV3_2.Document & { paths: OpenAPIV3_2.PathsObject } => ({
  openapi: '3.2.0',
  info: { title: 'Whole query', version: '1' },
  paths: {
    '/search': {
      parameters: [query],
      get: {
        'x-handler': 'return { query: req.query };',
        responses: { '200': { description: 'OK' } },
      },
    },
  },
})

describe('querystring-parameter', () => {
  it('validates inherited JSON content and exposes it directly to the handler', async () => {
    const server = await createMockServer({ document: documentWith(parameter) })
    const response = await server.request(`/search?${encodeURIComponent('{"limit":2}')}`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ query: { limit: 2 } })
  })

  it.each(['{"limit":"2"}', '{"limit":2,"extra":true}', '{', 'search={"limit":2}', '%ZZ'])(
    'rejects invalid whole-query input %s',
    async (value) => {
      const server = await createMockServer({ document: documentWith(parameter) })
      const response = await server.request(`/search?${encodeURIComponent(value)}`)
      expect(response.status).toBe(422)
    },
  )

  it('requires the query independently of its content schema', async () => {
    const server = await createMockServer({ document: documentWith({ ...parameter, content: { 'text/plain': {} } }) })
    const response = await server.request('/search')
    expect(response.status).toBe(422)
    expect((await response.json()).violations).toEqual([
      { location: 'query', path: '', message: 'Query string is required' },
    ])
  })

  it('allows an absent optional query', async () => {
    const server = await createMockServer({ document: documentWith({ ...parameter, required: false }) })
    const response = await server.request('/search')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
  })

  it('honors operation overrides and resolves component parameters', async () => {
    const document = {
      ...documentWith(parameter),
      components: {
        parameters: { query: { ...parameter, content: { 'text/plain': { schema: { type: 'string' } } } } },
      },
      paths: {
        '/search': {
          parameters: [parameter],
          get: {
            parameters: [{ $ref: '#/components/parameters/query' }],
            'x-handler': 'return { query: req.query };',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    const server = await createMockServer({ document })
    const response = await server.request('/search?a%2Bb+c%26d%3De')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ query: 'a+b+c&d=e' })
  })

  it('decodes handler queries when request validation is disabled', async () => {
    const server = await createMockServer({ document: documentWith(parameter), validateRequest: false })
    const response = await server.request('/search?%5B1%2C2%5D')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ query: [1, 2] })
  })

  it('validates form content including repeated arrays and JSON objects', async () => {
    const query = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            properties: {
              limit: { type: 'integer' },
              tags: { type: 'array', items: { type: 'string' } },
              filter: { type: 'object', properties: { active: { type: 'boolean' } } },
            },
            required: ['limit', 'tags', 'filter'],
            additionalProperties: false,
          },
        },
      },
    } satisfies OpenAPIV3_2.ParameterObject
    const server = await createMockServer({ document: documentWith(query) })
    const response = await server.request('/search?limit=2&tags=a+b&tags=c%2Bd&filter=%7B%22active%22%3Atrue%7D')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ query: { limit: '2', tags: ['a b', 'c+d'], filter: { active: true } } })
    expect((await server.request('/search?limit=bad&tags=a&filter=%7B%7D')).status).toBe(422)
    expect((await server.request('/search?limit=2&tags=a&filter=%7B%7D&unknown=x')).status).toBe(422)
  })

  it('rejects invalid native JSON types inside form content before coercion', async () => {
    const query = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              filter: { type: 'object', properties: { active: { type: 'boolean' } } },
            },
          },
        },
      },
    } satisfies OpenAPIV3_2.ParameterObject
    const server = await createMockServer({ document: documentWith(query) })
    expect((await server.request('/search?count=2&filter=%7B%22active%22%3A%22false%22%7D')).status).toBe(422)
    expect((await server.request('/search?count=2&filter=%7B%22active%22%3Afalse%7D')).status).toBe(200)
  })

  it('preserves alternatives when strictly validating JSON form properties', async () => {
    const query: OpenAPIV3_2.ParameterObject = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            anyOf: [
              {
                type: 'object',
                properties: { filter: { type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] } },
              },
              {
                type: 'object',
                properties: { filter: { type: 'object', properties: { b: { type: 'integer' } }, required: ['b'] } },
              },
            ],
          },
        },
      },
    }
    const server = await createMockServer({ document: documentWith(query) })
    expect((await server.request('/search?filter=%7B%22a%22%3A1%7D')).status).toBe(200)
    expect((await server.request('/search?filter=%7B%22b%22%3A1%7D')).status).toBe(200)
    expect((await server.request('/search?filter=%7B%22b%22%3A%221%22%7D')).status).toBe(422)
  })

  it('uses explicit form encoding for arrays and objects', () => {
    const query = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
              filter: { type: 'object', properties: { active: { type: 'string' } } },
            },
          },
          encoding: { tags: { style: 'pipeDelimited', explode: false }, filter: { style: 'deepObject' } },
        },
      },
    } satisfies OpenAPIV3_2.ParameterObject
    expect(parseQuerystringParameter('http://localhost/?tags=a%7Cb&filter[active]=yes', query)).toEqual({
      tags: ['a', 'b'],
      filter: { active: 'yes' },
    })
  })

  it('treats JSONPath as text and rejects malformed percent escaping', () => {
    const query = {
      ...parameter,
      content: { 'application/jsonpath': { schema: { type: 'string' } } },
    } satisfies OpenAPIV3_2.ParameterObject
    expect(parseQuerystringParameter('http://localhost/?%24.books%5B%3F%40.price%3C10%5D', query)).toBe(
      '$.books[?@.price<10]',
    )
    expect(() => parseQuerystringParameter('http://localhost/?%ZZ', query)).toThrow(URIError)
  })

  it('enforces a boolean false content schema', async () => {
    const query = { ...parameter, content: { 'application/json': { schema: false } } }
    const document = documentWith(parameter)
    const server = await createMockServer({
      document: { ...document, paths: { '/search': { ...document.paths['/search'], parameters: [query] } } },
    })
    expect((await server.request('/search?null')).status).toBe(422)
  })

  it('decodes form properties declared in composed schemas', () => {
    const query = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            allOf: [{ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } }],
          },
        },
      },
    } satisfies OpenAPIV3_2.ParameterObject
    expect(parseQuerystringParameter('http://localhost/?tags=a', query)).toEqual({ tags: ['a'] })
  })

  it('keeps sibling properties separate from exploded free-form objects', () => {
    const query = {
      ...parameter,
      content: {
        'application/x-www-form-urlencoded': {
          schema: { type: 'object', properties: { limit: { type: 'integer' }, filter: { type: 'object' } } },
          encoding: { filter: { style: 'form', explode: true } },
        },
      },
    } satisfies OpenAPIV3_2.ParameterObject
    expect(parseQuerystringParameter('http://localhost/?limit=2&color=blue', query)).toEqual({
      limit: '2',
      filter: { color: 'blue' },
    })
  })

  it('leaves malformed queries unavailable when validation is disabled', async () => {
    const server = await createMockServer({ document: documentWith(parameter), validateRequest: false })
    const response = await server.request('/search?%ZZ')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
  })
})
