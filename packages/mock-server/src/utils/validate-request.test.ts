import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it, vi } from 'vitest'

import { createMockServer } from '../create-mock-server'

/** Build a tiny document around a single operation for the route under test */
const documentWith = (path: string, method: string, operation: OpenAPIV3_1.OperationObject) => ({
  openapi: '3.1.0',
  info: { title: 'Validation', version: '1.0.0' },
  paths: {
    [path]: {
      [method]: {
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { example: { ok: true } } },
          },
        },
        ...operation,
      },
    },
  },
})

/**
 * Post a JSON body to an operation whose request body is `#/components/schemas/Root`, so a recursive
 * schema can be exercised end to end. Cutting the cycle makes a subschema accept more, which under
 * `not`, `if`, `oneOf` or `contains` would make the operation reject more than the document does.
 */
const postRecursiveBody = async (schemas: Record<string, unknown>, body: unknown) => {
  const document = {
    openapi: '3.1.0',
    info: { title: 'Validation', version: '1.0.0' },
    components: { schemas },
    paths: {
      '/nodes': {
        post: {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Root' } } },
          },
          responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
        },
      },
    },
  }

  const server = await createMockServer({ document, validateRequest: true })

  return server.request('/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const NULLABLE_SCHEMAS = {
  oneOf: { nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] },
  anyOf: { nullable: true, anyOf: [{ type: 'string' }, { type: 'integer' }] },
  allOf: { nullable: true, allOf: [{ $ref: '#/components/schemas/Name' }] },
  'a nullable only schema': { nullable: true },
  'nullable false': { nullable: false, oneOf: [{ type: 'string' }, { type: 'integer' }] },
} as const

const postRecord = async (openapi: string, value: unknown, body: unknown): Promise<Response> => {
  const document = {
    ...documentWith('/records', 'post', {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, value } },
          },
        },
      },
    }),
    openapi,
    components: { schemas: { Name: { type: 'string' } } },
  }
  const server = await createMockServer({ document, validateRequest: true })
  return server.request('/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('validate-request', () => {
  it('passes a valid request through to the normal mock response', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/items?limit=10')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true })
  })

  it('returns 422 with a query violation for a missing required query param', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/items')

    expect(response.status).toBe(422)
    expect(response.headers.get('Content-Type')).toContain('application/problem+json')

    const body = await response.json()
    expect(body.error).toBe('Request validation failed')
    expect(body.violations).toEqual([expect.objectContaining({ location: 'query', path: '/limit' })])
  })

  it('returns 422 for a wrong-typed query param and coerces a correct one', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const invalid = await server.request('/items?limit=abc')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })

    const valid = await server.request('/items?limit=42')
    expect(valid.status).toBe(200)
  })

  it('returns 422 for a wrong-typed path param and coerces a correct one', async () => {
    const document = documentWith('/items/{id}', 'get', {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const invalid = await server.request('/items/abc')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'path' })

    const valid = await server.request('/items/123')
    expect(valid.status).toBe(200)
  })

  it.each([
    ['/files/{id}.json', '/files/42.json', '/files/abc.json'],
    ['/jobs/{id}:cancel', '/jobs/42:cancel', '/jobs/abc:cancel'],
    ['/api/v{id}/status', '/api/v42/status', '/api/vabc/status'],
    ['/users:batchGet/{id}', '/users:batchGet/42', '/users:batchGet/abc'],
  ])('validates a path param that shares its segment with literal text: %s', async (path, valid, invalid) => {
    const document = documentWith(path, 'get', {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    expect((await server.request(valid)).status).toBe(200)

    const rejected = await server.request(invalid)
    expect(rejected.status).toBe(422)
    expect((await rejected.json()).violations).toMatchObject([{ location: 'path', path: '/id' }])
  })

  it('validates every path param of a segment that holds several', async () => {
    const document = documentWith('/range/{from}-{to}', 'get', {
      parameters: [
        { name: 'from', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'to', in: 'path', required: true, schema: { type: 'integer' } },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    expect((await server.request('/range/1-5')).status).toBe(200)

    const rejected = await server.request('/range/1-x')
    expect(rejected.status).toBe(422)
    expect((await rejected.json()).violations).toMatchObject([{ location: 'path', path: '/to' }])
  })

  it.each([
    ['1', '5'],
    ['-1', '5'],
    ['1', '-5'],
    ['-1', '-5'],
  ])('validates and binds signed range parameters: %s to %s', async (from, to) => {
    const document = documentWith('/range/{from}-{to}', 'get', {
      parameters: [
        { name: 'from', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'to', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      'x-handler': 'return req.params',
    })
    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request(`/range/${from}-${to}`)

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ from, to })
  })

  it('returns 422 for a missing required header param and coerces a correct one', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'X-Api-Version', in: 'header', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const missing = await server.request('/items')
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'header', path: '/X-Api-Version' })

    const wrongType = await server.request('/items', { headers: { 'X-Api-Version': 'abc' } })
    expect(wrongType.status).toBe(422)
    expect((await wrongType.json()).violations[0]).toMatchObject({ location: 'header' })

    const valid = await server.request('/items', { headers: { 'X-Api-Version': '2' } })
    expect(valid.status).toBe(200)
  })

  it('matches header parameter names case-insensitively', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'X-Api-Version', in: 'header', required: true, schema: { type: 'string' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // The client sends a differently cased header name, which must still satisfy the requirement.
    const response = await server.request('/items', { headers: { 'x-api-version': '2024-01' } })
    expect(response.status).toBe(200)
  })

  it('ignores Accept, Content-Type, and Authorization header parameters', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        { name: 'Accept', in: 'header', required: true, schema: { type: 'string' } },
        { name: 'Content-Type', in: 'header', required: true, schema: { type: 'string' } },
        { name: 'Authorization', in: 'header', required: true, schema: { type: 'string' } },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // These headers are defined elsewhere in OpenAPI, so they are not enforced as parameters.
    const response = await server.request('/items')
    expect(response.status).toBe(200)
  })

  it('returns 422 for a missing required cookie param and coerces a correct one', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'session', in: 'cookie', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const missing = await server.request('/items')
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'cookie', path: '/session' })

    const wrongType = await server.request('/items', { headers: { Cookie: 'session=abc' } })
    expect(wrongType.status).toBe(422)
    expect((await wrongType.json()).violations[0]).toMatchObject({ location: 'cookie' })

    const valid = await server.request('/items', { headers: { Cookie: 'session=42' } })
    expect(valid.status).toBe(200)
  })

  it('passes when an optional header or cookie param is absent', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        { name: 'X-Api-Version', in: 'header', required: false, schema: { type: 'string' } },
        { name: 'session', in: 'cookie', required: false, schema: { type: 'string' } },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items')
    expect(response.status).toBe(200)
  })

  it('enforces a required header param that declares no schema', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'X-Request-Id', in: 'header', required: true }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const missing = await server.request('/items')
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'header', path: '/X-Request-Id' })

    const present = await server.request('/items', { headers: { 'X-Request-Id': 'abc' } })
    expect(present.status).toBe(200)
  })

  it('aggregates violations across header, query, and body in one response', async () => {
    const document = documentWith('/items', 'post', {
      parameters: [
        { name: 'X-Api-Version', in: 'header', required: true, schema: { type: 'integer' } },
        { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Every location is violated at once: missing header, missing query, and a body missing `name`.
    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(422)
    const locations = (await response.json()).violations.map((violation: { location: string }) => violation.location)
    expect(locations).toEqual(expect.arrayContaining(['header', 'query', 'body']))
  })

  it('validates exploded form array query params from repeated values', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'ids', in: 'query', required: true, schema: { type: 'array', items: { type: 'integer' } } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `?ids=1&ids=2&ids=3` is the default (form, explode) serialization for an array query param.
    const valid = await server.request('/items?ids=1&ids=2&ids=3')
    expect(valid.status).toBe(200)

    // A non-integer element must be reported, not silently coerced away.
    const invalid = await server.request('/items?ids=1&ids=abc')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('validates comma- and pipe-delimited array query params', async () => {
    const comma = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'ids',
          in: 'query',
          required: true,
          explode: false,
          schema: { type: 'array', items: { type: 'integer' }, minItems: 2 },
        },
      ],
    })

    const commaServer = await createMockServer({ document: comma, validateRequest: true })
    expect((await commaServer.request('/items?ids=1,2,3')).status).toBe(200)

    const pipe = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'ids',
          in: 'query',
          required: true,
          style: 'pipeDelimited',
          schema: { type: 'array', items: { type: 'integer' }, minItems: 2 },
        },
      ],
    })

    const pipeServer = await createMockServer({ document: pipe, validateRequest: true })
    // A single value cannot satisfy `minItems: 2`, proving the value is parsed as an array, not a string.
    expect((await pipeServer.request('/items?ids=1')).status).toBe(422)
    expect((await pipeServer.request('/items?ids=1|2|3')).status).toBe(200)
  })

  it('validates comma-separated array params in path, header, and cookie', async () => {
    const document = documentWith('/items/{ids}', 'get', {
      parameters: [
        { name: 'ids', in: 'path', required: true, schema: { type: 'array', items: { type: 'integer' } } },
        { name: 'X-Tags', in: 'header', required: true, schema: { type: 'array', items: { type: 'string' } } },
        // Cookies default to `form`/explode, so comma-joined arrays must declare `explode: false`.
        {
          name: 'roles',
          in: 'cookie',
          required: true,
          explode: false,
          schema: { type: 'array', items: { type: 'integer' } },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const valid = await server.request('/items/1,2,3', {
      headers: { 'X-Tags': 'a,b,c', Cookie: 'roles=1,2' },
    })
    expect(valid.status).toBe(200)

    // A wrong-typed element in the comma-separated cookie array must fail.
    const invalid = await server.request('/items/1,2,3', {
      headers: { 'X-Tags': 'a,b', Cookie: 'roles=1,nope' },
    })
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'cookie' })
  })

  it('validates deepObject query params', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: true,
          style: 'deepObject',
          explode: true,
          schema: {
            type: 'object',
            required: ['min'],
            properties: { min: { type: 'integer' }, max: { type: 'integer' } },
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `?filter[min]=1&filter[max]=9` deserializes to `{ min: 1, max: 9 }` before validation.
    const valid = await server.request('/items?filter[min]=1&filter[max]=9')
    expect(valid.status).toBe(200)

    // A non-integer property is reported rather than coerced away.
    const invalid = await server.request('/items?filter[min]=abc')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('validates exploded form object query params from top-level keys', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'color',
          in: 'query',
          required: true,
          schema: {
            type: 'object',
            required: ['r'],
            properties: { r: { type: 'integer' }, g: { type: 'integer' } },
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // The default object serialization (form, explode) spreads properties across top-level keys.
    const valid = await server.request('/items?r=100&g=200')
    expect(valid.status).toBe(200)

    const invalid = await server.request('/items?g=200')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('gathers exploded form object query params declared through anyOf composition', async () => {
    // An optional object (FastAPI/Pydantic `Optional[…]`) keeps its properties on a subschema, so the top
    // level looks empty. The property names must still be collected so the exploded `form` object is
    // gathered from its declared keys. Otherwise it falls back to free-form gathering and claims every
    // undeclared key (such as `extra` below), which the `additionalProperties: false` inner schema rejects.
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'color',
          in: 'query',
          required: true,
          schema: {
            anyOf: [
              {
                type: 'object',
                required: ['r'],
                additionalProperties: false,
                properties: { r: { type: 'integer' }, g: { type: 'integer' } },
              },
              { type: 'null' },
            ],
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // An undeclared `extra` key must not be swallowed into `color` and trip `additionalProperties: false`.
    const valid = await server.request('/items?r=100&g=200&extra=oops')
    expect(valid.status).toBe(200)

    const invalid = await server.request('/items?extra=oops')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('validates comma-separated object params in path and header', async () => {
    const document = documentWith('/items/{point}', 'get', {
      parameters: [
        {
          name: 'point',
          in: 'path',
          required: true,
          schema: { type: 'object', properties: { x: { type: 'integer' }, y: { type: 'integer' } } },
        },
        {
          name: 'X-Color',
          in: 'header',
          required: true,
          explode: true,
          schema: { type: 'object', properties: { r: { type: 'integer' }, g: { type: 'integer' } } },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Path simple (non-exploded): `x,1,y,2`; header simple exploded: `r=100,g=200`.
    const valid = await server.request('/items/x,1,y,2', { headers: { 'X-Color': 'r=100,g=200' } })
    expect(valid.status).toBe(200)

    const invalid = await server.request('/items/x,nope,y,2', { headers: { 'X-Color': 'r=100,g=200' } })
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'path' })
  })

  it('validates exploded form object cookie params from per-property cookies', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'color',
          in: 'cookie',
          required: true,
          schema: {
            type: 'object',
            required: ['r'],
            properties: { r: { type: 'integer' }, g: { type: 'integer' } },
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Cookies default to `form`/explode, so each object property is sent as its own cookie.
    const valid = await server.request('/items', { headers: { Cookie: 'r=100; g=200' } })
    expect(valid.status).toBe(200)

    // A wrong-typed property must fail rather than slip through unvalidated.
    const wrongType = await server.request('/items', { headers: { Cookie: 'r=nope; g=200' } })
    expect(wrongType.status).toBe(422)
    expect((await wrongType.json()).violations[0]).toMatchObject({ location: 'cookie' })

    // A missing required property must fail rather than report a false missing-parameter.
    const missing = await server.request('/items', { headers: { Cookie: 'g=200' } })
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'cookie' })
  })

  it('validates label-style array and object path params', async () => {
    const arrayDoc = documentWith('/items/{ids}', 'get', {
      parameters: [
        {
          name: 'ids',
          in: 'path',
          required: true,
          style: 'label',
          schema: { type: 'array', items: { type: 'integer' }, minItems: 2 },
        },
      ],
    })

    const arrayServer = await createMockServer({ document: arrayDoc, validateRequest: true })
    // `label` defaults to `explode: false`, where elements are comma-separated after the leading dot.
    expect((await arrayServer.request('/items/.1,2,3')).status).toBe(200)
    // A single element cannot meet `minItems: 2`, proving the list is parsed as an array.
    expect((await arrayServer.request('/items/.1')).status).toBe(422)

    const objectDoc = documentWith('/points/{point}', 'get', {
      parameters: [
        {
          name: 'point',
          in: 'path',
          required: true,
          style: 'label',
          explode: true,
          schema: { type: 'object', required: ['x'], properties: { x: { type: 'integer' }, y: { type: 'integer' } } },
        },
      ],
    })

    const objectServer = await createMockServer({ document: objectDoc, validateRequest: true })
    expect((await objectServer.request('/points/.x=1.y=2')).status).toBe(200)
    expect((await objectServer.request('/points/.x=nope')).status).toBe(422)

    // Non-exploded `label` objects (the default) carry comma-separated key,value pairs: `.x,1,y,2`.
    const nonExplodedDoc = documentWith('/points/{point}', 'get', {
      parameters: [
        {
          name: 'point',
          in: 'path',
          required: true,
          style: 'label',
          schema: { type: 'object', required: ['x'], properties: { x: { type: 'integer' }, y: { type: 'integer' } } },
        },
      ],
    })

    const nonExplodedServer = await createMockServer({ document: nonExplodedDoc, validateRequest: true })
    expect((await nonExplodedServer.request('/points/.x,1,y,2')).status).toBe(200)
    expect((await nonExplodedServer.request('/points/.x,nope')).status).toBe(422)
  })

  it('validates matrix-style array and object path params', async () => {
    const arrayDoc = documentWith('/items/{ids}', 'get', {
      parameters: [
        {
          name: 'ids',
          in: 'path',
          required: true,
          style: 'matrix',
          explode: true,
          schema: { type: 'array', items: { type: 'integer' } },
        },
      ],
    })

    const arrayServer = await createMockServer({ document: arrayDoc, validateRequest: true })
    expect((await arrayServer.request('/items/;ids=1;ids=2;ids=3')).status).toBe(200)
    expect((await arrayServer.request('/items/;ids=1;ids=nope')).status).toBe(422)
    // An empty array (`;ids`) has no elements, so it is valid without `minItems` instead of failing as `['ids']`.
    expect((await arrayServer.request('/items/;ids')).status).toBe(200)

    const objectDoc = documentWith('/points/{point}', 'get', {
      parameters: [
        {
          name: 'point',
          in: 'path',
          required: true,
          style: 'matrix',
          schema: { type: 'object', required: ['x'], properties: { x: { type: 'integer' }, y: { type: 'integer' } } },
        },
      ],
    })

    const objectServer = await createMockServer({ document: objectDoc, validateRequest: true })
    // Non-exploded matrix object: `;point=x,1,y,2`.
    expect((await objectServer.request('/points/;point=x,1,y,2')).status).toBe(200)
    expect((await objectServer.request('/points/;point=x,nope')).status).toBe(422)
  })

  it('validates label- and matrix-style primitive path params', async () => {
    const documentFor = (style: string) =>
      documentWith('/users/{id}', 'get', {
        parameters: [{ name: 'id', in: 'path', required: true, style, schema: { type: 'integer' } }],
      })

    // A `label` primitive is dot-prefixed: `.5`.
    const labelServer = await createMockServer({ document: documentFor('label'), validateRequest: true })
    expect((await labelServer.request('/users/.5')).status).toBe(200)
    expect((await labelServer.request('/users/.nope')).status).toBe(422)

    // A `matrix` primitive is `;name=value`: `;id=5`.
    const matrixServer = await createMockServer({ document: documentFor('matrix'), validateRequest: true })
    expect((await matrixServer.request('/users/;id=5')).status).toBe(200)
    expect((await matrixServer.request('/users/;id=nope')).status).toBe(422)
  })

  it.each([false, true])('preserves encoded delimiters in matrix primitives with explode=%s', async (explode) => {
    const document = documentWith('/users/{id}', 'get', {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          style: 'matrix',
          explode,
          schema: { type: 'string', enum: ['a', 'a;b=c'] },
        },
      ],
    })
    const server = await createMockServer({ document, validateRequest: true })

    expect((await server.request('/users/;id=a%3Bb%3Dc')).status).toBe(200)
    expect((await server.request('/users/;id=a%3Bignored')).status).toBe(422)
  })

  it.each([false, true])('validates encoded matrix parameter names with explode=%s', async (explode) => {
    const documentFor = (schema: OpenAPIV3_1.SchemaObject): ReturnType<typeof documentWith> =>
      documentWith('/users/{a=b}', 'get', {
        parameters: [{ name: 'a=b', in: 'path', required: true, style: 'matrix', explode, schema }],
      })
    const integerServer = await createMockServer({
      document: documentFor({ type: 'integer' }),
      validateRequest: true,
    })
    expect((await integerServer.request('/users/;a%3Db=5')).status).toBe(200)
    expect((await integerServer.request('/users/;a%3Db=nope')).status).toBe(422)

    const stringServer = await createMockServer({
      document: documentFor({ type: 'string', enum: ['', 'b=5', 'x;y=z'] }),
      validateRequest: true,
    })
    expect((await stringServer.request('/users/;a%3Db=5')).status).toBe(422)
    expect((await stringServer.request('/users/;a%3Db=b%3D5')).status).toBe(200)
    expect((await stringServer.request('/users/;a%3Db=x%3By%3Dz')).status).toBe(200)
    expect((await stringServer.request('/users/;a%3Db')).status).toBe(200)
    expect((await stringServer.request('/users/;a%3Db=')).status).toBe(200)
  })

  it.each(['application/json', 'application/vnd.scalar+json; charset=utf-8'])(
    'validates content typed as %s',
    async (mediaType) => {
      const document = documentWith('/items', 'get', {
        parameters: [
          { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
          {
            name: 'filter',
            in: 'query',
            required: true,
            content: {
              [mediaType]: {
                schema: { type: 'object', required: ['price'], properties: { price: { type: 'integer' } } },
              },
            },
          },
        ],
      })

      const server = await createMockServer({ document, validateRequest: true })
      const request = (value: string) => server.request(`/items?limit=10&filter=${encodeURIComponent(value)}`)

      expect((await request('{"price":5}')).status).toBe(200)

      const wrongType = await request('{"price":"5"}')
      expect(wrongType.status).toBe(422)
      expect((await wrongType.json()).violations).toStrictEqual([
        { location: 'query', path: '/filter/price', message: 'filter/price must be integer' },
      ])

      // A value that is not JSON cannot satisfy an object schema.
      expect((await request('price=5')).status).toBe(422)
      expect((await server.request('/items?limit=10')).status).toBe(422)
    },
  )

  it.each([
    {
      mediaType: 'text/plain',
      valid: 'short',
      invalid: 'far too long',
      message: 'X-Note must NOT have more than 5 characters',
    },
    { mediaType: 'application/json', valid: '"short"', invalid: 'short', message: 'X-Note must be valid JSON' },
  ])('validates a string header declared as $mediaType', async ({ mediaType, valid, invalid, message }) => {
    const document = documentWith('/items', 'get', {
      parameters: [
        { name: 'X-Note', in: 'header', content: { [mediaType]: { schema: { type: 'string', maxLength: 5 } } } },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })
    expect((await server.request('/items', { headers: { 'X-Note': valid } })).status).toBe(200)
    const rejected = await server.request('/items', { headers: { 'X-Note': invalid } })
    expect(rejected.status).toBe(422)
    expect((await rejected.json()).violations).toStrictEqual([{ location: 'header', path: '/X-Note', message }])
  })

  it('checks presence and false schemas for unsupported parameter media types', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        { name: 'filter', in: 'query', required: true, content: { 'application/xml': { schema: { type: 'object' } } } },
        { name: 'forbidden', in: 'query', content: { 'application/xml': { schema: false } } },
      ],
    })
    const server = await createMockServer({ document, validateRequest: true })

    expect((await server.request('/items?filter=%3Citem%2F%3E')).status).toBe(200)
    const invalid = await server.request('/items?forbidden=%3Citem%2F%3E')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations).toStrictEqual([
      { location: 'query', path: '/filter', message: 'filter is required' },
      { location: 'query', path: '/forbidden', message: 'forbidden boolean schema is false' },
    ])
  })

  it('returns 422 with body violations for an invalid JSON body', async () => {
    const document = documentWith('/items', 'post', {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string' }, age: { type: 'integer' } },
            },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Missing required field
    const missingField = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age: 30 }),
    })
    expect(missingField.status).toBe(422)
    expect((await missingField.json()).violations).toEqual([expect.objectContaining({ location: 'body' })])

    // Wrong type
    const wrongType = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane', age: 'old' }),
    })
    expect(wrongType.status).toBe(422)
    expect((await wrongType.json()).violations[0]).toMatchObject({ location: 'body', path: '/age' })
  })

  it('returns 422 for unparseable JSON even when the body is optional', async () => {
    const document = documentWith('/items', 'post', {
      requestBody: {
        required: false,
        content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    })

    expect(response.status).toBe(422)
    expect((await response.json()).violations[0]).toMatchObject({ location: 'body' })
  })

  it('validates path-item-level parameters shared across operations', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Validation', version: '1.0.0' },
      paths: {
        '/items': {
          // Declared on the path item, so it applies to every operation underneath.
          parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
          get: {
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document, validateRequest: true })

    const missing = await server.request('/items')
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'query', path: '/limit' })

    const valid = await server.request('/items?limit=5')
    expect(valid.status).toBe(200)
  })

  it('lets an operation parameter override a path-item parameter of the same name', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Validation', version: '1.0.0' },
      paths: {
        '/items': {
          // Required on the path item, but the operation relaxes it to optional.
          parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
          get: {
            parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document, validateRequest: true })

    // The operation-level override wins, so a missing `limit` is allowed.
    const response = await server.request('/items')
    expect(response.status).toBe(200)
  })

  it('returns 422 when a required body is missing, but passes when an optional body is missing', async () => {
    const requiredDoc = documentWith('/items', 'post', {
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
      },
    })

    const requiredServer = await createMockServer({ document: requiredDoc, validateRequest: true })
    const requiredResponse = await requiredServer.request('/items', { method: 'POST' })
    expect(requiredResponse.status).toBe(422)
    expect((await requiredResponse.json()).violations[0]).toMatchObject({ location: 'body' })

    const optionalDoc = documentWith('/items', 'post', {
      requestBody: {
        required: false,
        content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
      },
    })

    const optionalServer = await createMockServer({ document: optionalDoc, validateRequest: true })
    const optionalResponse = await optionalServer.request('/items', { method: 'POST' })
    expect(optionalResponse.status).toBe(200)
  })

  it('leaves the JSON body intact for a downstream x-handler', async () => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice' }),
    })

    // Validation reads the body, but the handler must still see it.
    expect((await response.json()).received).toEqual({ name: 'Alice' })
  })

  it('leaves a form body intact for a downstream x-handler', async () => {
    const document = documentWith('/form', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        required: true,
        content: {
          'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Alice&age=30',
    })

    // The body required check reads the stream; `parseBody` downstream must still reconstruct the form.
    expect((await response.json()).received).toEqual({ name: 'Alice', age: '30' })
  })

  it('validates by default when validateRequest is unset', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document })
    const response = await server.request('/items')

    expect(response.status).toBe(422)
  })

  it('lets invalid requests pass when validateRequest is explicitly false', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: false })
    const response = await server.request('/items')

    expect(response.status).toBe(200)
  })

  it('reuses the compiled validator across requests (no per-request recompilation)', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    // Validators are compiled once at route setup. Spy on Ajv's compile to prove that
    // making requests does not trigger any further compilation.
    const compileSpy = vi.spyOn(Ajv2020.prototype, 'compile')

    const server = await createMockServer({ document, validateRequest: true })
    const compilesAfterSetup = compileSpy.mock.calls.length
    expect(compilesAfterSetup).toBeGreaterThan(0)

    const first = await server.request('/items?limit=1')
    const second = await server.request('/items?limit=2')
    const third = await server.request('/items')

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(third.status).toBe(422)

    // No additional compilation happened while serving requests.
    expect(compileSpy.mock.calls.length).toBe(compilesAfterSetup)

    compileSpy.mockRestore()
  })

  it('does not crash on a malformed schema and falls open', async () => {
    const document = documentWith('/items', 'get', {
      // `type` referencing an unknown keyword combination that cannot compile
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'not-a-real-type' } as never }],
    })

    const server = await createMockServer({ document, validateRequest: true })
    const response = await server.request('/items')

    // Validation is skipped for this operation, so the request still resolves to the mock.
    expect(response.status).toBe(200)
  })

  it('keeps working validators when only the body schema fails to compile', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const document = documentWith('/items', 'post', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        // A body schema that cannot compile must not disable the query validator above.
        content: { 'application/json': { schema: { type: 'not-a-real-type' } as never } },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })

    // The query validator still runs even though the body schema fell open.
    const response = await server.request('/items', { method: 'POST' })
    expect(response.status).toBe(422)
    expect((await response.json()).violations[0]).toMatchObject({ location: 'query', path: '/limit' })

    consoleErrorSpy.mockRestore()
  })

  it('validates a recursive request body instead of falling open on the circular marker', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const document = {
      openapi: '3.1.0',
      info: { title: 'Validation', version: '1.0.0' },
      components: {
        schemas: {
          Node: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              // Resolving this cycle leaves a `'[circular]'` marker that Ajv refuses to compile.
              child: { $ref: '#/components/schemas/Node' },
            },
          },
        },
      },
      paths: {
        '/nodes': {
          post: {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Node' } } },
            },
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document, validateRequest: true })

    const post = (body: unknown) =>
      server.request('/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

    const invalid = await post({ child: { name: 'leaf' } })
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations).toStrictEqual([
      { location: 'body', path: '/name', message: "must have required property 'name'" },
    ])

    // The recursion point accepts anything, so a nested value never turns a valid body into a 422.
    const valid = await post({ name: 'root', child: { anything: true } })
    expect(valid.status).toBe(200)

    // Compiling the schema no longer fails, so no error is logged for it either.
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('validates a recursive parameter schema instead of falling open on the circular marker', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const document = {
      openapi: '3.1.0',
      info: { title: 'Validation', version: '1.0.0' },
      components: {
        schemas: {
          Filter: {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' }, parent: { $ref: '#/components/schemas/Filter' } },
          },
        },
      },
      paths: {
        '/items': {
          get: {
            parameters: [
              {
                name: 'filter',
                in: 'query',
                required: true,
                style: 'deepObject',
                explode: true,
                schema: { $ref: '#/components/schemas/Filter' },
              },
            ],
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document, validateRequest: true })

    const invalid = await server.request('/items?filter[parent]=x')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations).toStrictEqual([
      { location: 'query', path: '/filter', message: "filter must have required property 'name'" },
    ])

    const valid = await server.request('/items?filter[name]=a')
    expect(valid.status).toBe(200)

    // Compiling the schema no longer fails, so no error is logged for it either.
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('still deserializes an object parameter whose recursive composition the rewrite drops', async () => {
    // The rewrite drops the `oneOf` the cycle ran through, which would leave the parameter looking
    // like a plain string: it would never be gathered from `filter[name]`, and the request would be
    // rejected as missing. Only the validator sees the rewritten schema, so the shape survives.
    const document = {
      openapi: '3.1.0',
      info: { title: 'Validation', version: '1.0.0' },
      components: {
        schemas: {
          Filter: {
            oneOf: [
              { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
              {
                type: 'object',
                required: ['parent'],
                properties: { parent: { $ref: '#/components/schemas/Filter' } },
              },
            ],
          },
        },
      },
      paths: {
        '/items': {
          get: {
            parameters: [
              {
                name: 'filter',
                in: 'query',
                required: true,
                style: 'deepObject',
                explode: true,
                schema: { $ref: '#/components/schemas/Filter' },
              },
            ],
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { ok: true } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items?filter[name]=a')
    expect(response.status).toBe(200)
  })

  it('accepts a body whose recursive oneOf branch still matches exactly once', async () => {
    // A union whose branches only differ in what `next` may be: `5` is a leaf, never a node. Relaxing
    // the recursive branch would let the body match both branches, which `oneOf` reports as a
    // violation — so the composition is dropped instead of inverted.
    const response = await postRecursiveBody(
      {
        Root: {
          type: 'object',
          oneOf: [
            { required: ['next'], properties: { next: { $ref: '#/components/schemas/Root' } } },
            { required: ['next'], properties: { next: { type: 'integer' } } },
          ],
        },
      },
      { next: 5 },
    )

    expect(response.status).toBe(200)
  })

  it('validates a body whose recursion sits under the draft-07 dependencies keyword', async () => {
    // Naming an owner is only required once the node has a name, and an owner is a node in turn.
    const recursiveDependency = {
      Root: {
        type: 'object',
        properties: { name: { type: 'string' } },
        dependencies: {
          name: { required: ['owner'], properties: { owner: { $ref: '#/components/schemas/Root' } } },
        },
      },
    }

    const missingOwner = await postRecursiveBody(recursiveDependency, { name: 'a' })
    expect(missingOwner.status).toBe(422)
    expect((await missingOwner.json()).violations).toStrictEqual([
      { location: 'body', path: '/owner', message: "must have required property 'owner'" },
    ])

    const withOwner = await postRecursiveBody(recursiveDependency, { name: 'a', owner: { name: 'b', owner: {} } })
    expect(withOwner.status).toBe(200)
  })

  it('accepts a body a recursive not allows', async () => {
    // The body is not a Banned value, because its `next` is not an object.
    const response = await postRecursiveBody(
      {
        Root: { type: 'object', not: { $ref: '#/components/schemas/Banned' } },
        Banned: {
          type: 'object',
          required: ['next'],
          properties: { next: { $ref: '#/components/schemas/Root' } },
        },
      },
      { a: 'nope', next: 5 },
    )

    expect(response.status).toBe(200)
  })

  it('accepts a body a recursive if condition never applies to', async () => {
    // The body does not match `Cond`, so the `extra` property `then` asks for is not required.
    const response = await postRecursiveBody(
      {
        Root: {
          type: 'object',
          if: { $ref: '#/components/schemas/Cond' },
          // biome-ignore lint/suspicious/noThenProperty: JSON Schema uses then as a conditional keyword, not a Promise method.
          then: { required: ['extra'] },
        },
        Cond: {
          type: 'object',
          required: ['next'],
          properties: { next: { $ref: '#/components/schemas/Root' } },
        },
      },
      { kind: 'special', next: 5 },
    )

    expect(response.status).toBe(200)
  })

  it('validates and delivers a headerless JSON body using the bare media type', async () => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        required: true,
        content: {
          'application/json; charset=utf-8': { schema: { type: 'object', required: ['localized'] } },
          'application/json': {
            schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })

    // A string body would default to `text/plain`, so drop the header to exercise the absent case.
    const withoutContentType = (body: string) => {
      const request = new Request('http://localhost/items', { method: 'POST', body })
      request.headers.delete('Content-Type')
      return request
    }

    // No Content-Type header: validation must reject an invalid body...
    const invalid = await server.request(withoutContentType(JSON.stringify({})))
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations).toStrictEqual([
      { location: 'body', path: '/name', message: "must have required property 'name'" },
    ])

    // ...and a valid body must still reach the handler as `req.body`.
    const valid = await server.request(withoutContentType(JSON.stringify({ name: 'Alice' })))
    expect((await valid.json()).received).toEqual({ name: 'Alice' })
  })

  it('delivers a validated body to the handler for a mixed-case Content-Type', async () => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Media types are case-insensitive, so the validator and the handler must agree on `Application/JSON`.
    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'Application/JSON' },
      body: JSON.stringify({ name: 'Alice' }),
    })

    expect((await response.json()).received).toEqual({ name: 'Alice' })
  })

  it('validates and delivers bodies sent with a structured +json media type', async () => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        required: true,
        content: {
          'application/vnd.api+json': {
            schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          },
        },
      },
    })

    const server = await createMockServer({ document, validateRequest: true })
    const post = async (body: unknown): Promise<Response> =>
      server.request('/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify(body),
      })

    const invalid = await post({})
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'body' })

    // A valid body passes validation and reaches the handler as `req.body`.
    expect((await (await post({ name: 'Alice' })).json()).received).toEqual({ name: 'Alice' })
  })

  it.each([
    ['application/json', { name: 'Ada' }, 200],
    ['application/json', { active: true }, 422],
    ['Application/Merge-Patch+JSON; charset=utf-8', { active: true }, 200],
    ['application/merge-patch+json', { name: 'Ada' }, 422],
    ['application/vnd.api+json', { data: {} }, 200],
    ['application/vnd.api+json', { active: true }, 422],
    ['application/other+json', { active: true }, 200],
  ])('selects the request schema for %s and %j', async (contentType, body, status) => {
    const document = documentWith('/items', 'patch', {
      requestBody: {
        content: {
          'application/json': { schema: { type: 'object', required: ['name'] } },
          'application/merge-patch+json': { schema: { type: 'object', required: ['active'] } },
          'application/vnd.api+json': { schema: { type: 'object', required: ['data'] } },
        },
      },
    })
    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items', {
      method: 'PATCH',
      headers: { 'Content-Type': contentType },
      body: JSON.stringify(body),
    })

    expect(response.status).toBe(status)
  })

  it.each([
    ['application/unknown+json', { id: 42 }, 200],
    ['application/unknown+json', {}, 422],
    ['text/unknown+json', { id: 42 }, 422],
    ['application/vnd.api+json', {}, 200],
    ['application/vnd.api+json; profile="https://example.com/Profile"', {}, 422],
    ['application/vnd.api+json; profile="https://example.com/profile"', {}, 200],
    ['application/vnd.api+json; profile="https://example.com/profile;v2"', { versionTwo: true }, 200],
    ['application/vnd.api+json; profile="https://example.com/profile;v2"', { versionOne: true }, 422],
  ])('matches the most specific body media type for %s and %j', async (contentType, body, status) => {
    const document = documentWith('/items', 'post', {
      requestBody: {
        content: {
          '*/*': { schema: false },
          'application/*': { schema: { type: 'object', required: ['id'] } },
          'application/vnd.api+json': {},
          'application/vnd.api+json; profile="https://example.com/Profile"': {
            schema: { type: 'object', required: ['data'] },
          },
          'application/vnd.api+json; profile="https://example.com/profile;v1"': {
            schema: { type: 'object', required: ['versionOne'] },
          },
          'application/vnd.api+json; profile="https://example.com/profile;v2"': {
            schema: { type: 'object', required: ['versionTwo'] },
          },
        },
      },
    })
    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: JSON.stringify(body),
    })

    expect(response.status).toBe(status)
  })

  it('rejects a structured JSON body when its schema is false', async () => {
    const document = documentWith('/items', 'post', {
      requestBody: {
        content: { 'application/merge-patch+json': { schema: false } },
      },
    })
    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: '{}',
    })

    expect(response.status).toBe(422)
  })

  it('passes text/json to the handler as a raw string', async () => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { received: req.body };',
      requestBody: {
        content: {
          'application/json': { schema: { type: 'object', required: ['name'] } },
          'text/json': { schema: { type: 'string' } },
        },
      },
    })
    const server = await createMockServer({ document, validateRequest: true })
    const body = '{"example":true}'

    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'text/json' },
      body,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ received: body })
  })

  it.each([
    'application/json-seq',
    'application/json-seq; profile="https://example.com/text/md"',
    'application/json-seq; profile="https://example.com/application/x-www-form-urlencoded"',
    'invalid',
  ])('leaves the handler body unset for %s', async (contentType) => {
    const document = documentWith('/items', 'post', {
      'x-handler': 'return { hasBody: req.body !== undefined };',
    })
    const server = await createMockServer({ document })
    const response = await server.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: '\x1E{"name":"Ada"}\n',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ hasBody: false })
  })

  it('calls onRequest even when the request is rejected by validation', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const onRequest = vi.fn()
    const server = await createMockServer({ document, validateRequest: true, onRequest })

    // A rejected request (missing required query param) must still trigger onRequest.
    const rejected = await server.request('/items')
    expect(rejected.status).toBe(422)
    expect(onRequest).toHaveBeenCalledTimes(1)

    // A valid request triggers it exactly once too (no double-invocation from the handler).
    const ok = await server.request('/items?limit=5')
    expect(ok.status).toBe(200)
    expect(onRequest).toHaveBeenCalledTimes(2)
  })

  it('deserializes array params whose schema is wrapped in anyOf (Optional[List])', async () => {
    // FastAPI/Pydantic `Optional[List[int]]` is emitted as `anyOf: [{ type: 'array' }, { type: 'null' }]`.
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'ids',
          in: 'query',
          schema: { anyOf: [{ type: 'array', items: { type: 'integer' } }, { type: 'null' }] },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Repeated keys are the default form/explode array encoding and must validate as a structured array.
    const valid = await server.request('/items?ids=1&ids=2&ids=3')
    expect(valid.status).toBe(200)

    const invalid = await server.request('/items?ids=1&ids=nope')
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('accepts a present free-form object query param instead of reporting it missing', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'meta', in: 'query', required: true, schema: { type: 'object' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Default form/explode sends each property as its own key; the object is present, so this is valid.
    const valid = await server.request('/items?foo=1&bar=2')
    expect(valid.status).toBe(200)

    // With no properties at all the required object is genuinely absent.
    const missing = await server.request('/items')
    expect(missing.status).toBe(422)
    expect((await missing.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('does not let a free-form object swallow a sibling parameter to appear present', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        { name: 'meta', in: 'query', required: true, schema: { type: 'object' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `limit` is a declared sibling, so it must not satisfy the required free-form `meta` object.
    const onlySibling = await server.request('/items?limit=5')
    expect(onlySibling.status).toBe(422)
    expect((await onlySibling.json()).violations[0]).toMatchObject({ location: 'query', message: 'meta is required' })

    // A genuine free-form property alongside the sibling is accepted.
    const withMeta = await server.request('/items?limit=5&foo=1')
    expect(withMeta.status).toBe(200)
  })

  it('lets a free-form object claim a property that matches its own parameter name', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'meta', in: 'query', required: true, schema: { type: 'object' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `?meta=1` is the object property `meta`, not an absent parameter; excluding only siblings keeps it.
    const valid = await server.request('/items?meta=1')
    expect(valid.status).toBe(200)
  })

  it('does not falsely reject object input whose schema allows both array and object', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: true,
          schema: {
            anyOf: [
              { type: 'array', items: { type: 'integer' } },
              { type: 'object', properties: { x: { type: 'integer' } } },
            ],
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Object-style input must not be parsed with array rules (which would drop it and report it missing).
    const valid = await server.request('/items?x=1')
    expect(valid.status).toBe(200)
  })

  it('deserializes array input whose schema allows both array and object', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: true,
          schema: {
            anyOf: [
              { type: 'array', items: { type: 'integer' } },
              { type: 'object', properties: { x: { type: 'integer' } } },
            ],
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // Array-style input under the parameter's own key must be read as an array, not gathered as an object
    // (which would find none of the object branch's declared properties and report `filter` missing).
    const valid = await server.request('/items?filter=1&filter=2')
    expect(valid.status).toBe(200)
  })

  it('falls back to object reading for a union param when the array reading is empty', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          required: true,
          schema: {
            anyOf: [
              { type: 'array', items: { type: 'integer' } },
              { type: 'object', properties: { x: { type: 'integer' } } },
            ],
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // A lone empty value deserializes the array branch to `[]`. Since that is not array-shaped input, the
    // object reading must still run so object-style input (`filter=` plus the `x` property) is gathered as
    // `{ x: 1 }` instead of being locked to an empty array that fails the array branch's item validation.
    const valid = await server.request('/items?filter=&x=1')
    expect(valid.status).toBe(200)
  })

  it('keeps repeated values for an array-valued deepObject property', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          style: 'deepObject',
          explode: true,
          schema: {
            type: 'object',
            properties: { tags: { type: 'array', items: { type: 'string' } } },
          },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `filter[tags]=a&filter[tags]=b` must validate as a two-element array, not a single dropped value.
    const valid = await server.request('/items?filter[tags]=a&filter[tags]=b')
    expect(valid.status).toBe(200)
  })

  it('treats an empty array query value as zero elements against minItems', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'ids', in: 'query', schema: { type: 'array', items: { type: 'integer' }, minItems: 1 } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // `?ids=` is an empty array, so the `minItems: 1` constraint must fail rather than pass on a phantom ''.
    const empty = await server.request('/items?ids=')
    expect(empty.status).toBe(422)
    expect((await empty.json()).violations[0]).toMatchObject({ location: 'query' })
  })

  it('trims optional whitespace in a simple-style header array', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [
        {
          name: 'X-Tags',
          in: 'header',
          schema: { type: 'array', items: { type: 'string', enum: ['a', 'b', 'c'] } },
        },
      ],
    })

    const server = await createMockServer({ document, validateRequest: true })

    // The client sends the comma-separated header with whitespace, as HTTP allows; each element must
    // still match the enum rather than carrying a leading space.
    const valid = await server.request('/items', { headers: { 'X-Tags': 'a, b, c' } })
    expect(valid.status).toBe(200)
  })

  it('reports a missing required parameter as "<name> is required"', async () => {
    const document = documentWith('/items', 'get', {
      parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
    })

    const server = await createMockServer({ document, validateRequest: true })

    const response = await server.request('/items')
    expect(response.status).toBe(422)
    // The message must read clearly instead of "limit must have required property 'limit'".
    expect((await response.json()).violations[0]).toMatchObject({
      location: 'query',
      path: '/limit',
      message: 'limit is required',
    })
  })
  describe('read-only properties', () => {
    const postPet = async (schemas: Record<string, unknown>, body: unknown): Promise<Response> => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Validation', version: '1.0.0' },
        components: { schemas },
        paths: {
          '/pets': {
            post: {
              requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/NewPet' } } },
              },
              responses: {
                '201': { description: 'Created', content: { 'application/json': { example: { ok: true } } } },
              },
            },
          },
        },
      }
      const server = await createMockServer({ document, validateRequest: true })
      return server.request('/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    const pet = {
      type: 'object',
      required: ['id', 'createdAt', 'name'],
      properties: {
        id: { type: 'integer', readOnly: true },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
        name: { type: 'string' },
      },
    }

    it('accepts a body that leaves out required read-only properties', async () => {
      expect((await postPet({ NewPet: pet }, { name: 'Fido' })).status).toBe(201)
    })

    it('accepts a body that leaves out read-only properties inherited through allOf', async () => {
      const schemas = {
        Pet: pet,
        NewPet: {
          allOf: [{ $ref: '#/components/schemas/Pet' }, { required: ['tag'], properties: { tag: { type: 'string' } } }],
        },
      }

      expect((await postPet(schemas, { name: 'Fido', tag: 'dog' })).status).toBe(201)
    })

    it('accepts read-only properties composed through allOf', async () => {
      const schema = {
        ...pet,
        properties: { ...pet.properties, id: { allOf: [{ type: 'integer', readOnly: true }] } },
      }

      expect((await postPet({ NewPet: schema }, { name: 'Fido' })).status).toBe(201)
    })

    it('accepts read-only requirements in dependentSchemas', async () => {
      const schema = { ...pet, dependentSchemas: { name: { required: ['id', 'tag'] } } }

      expect((await postPet({ NewPet: schema }, { name: 'Fido', tag: 'dog' })).status).toBe(201)
      expect((await postPet({ NewPet: schema }, { name: 'Fido' })).status).toBe(422)
    })

    it('preserves conditional branch selection for omitted read-only properties', async () => {
      const schema = {
        ...pet,
        if: { required: ['id'] },
        // biome-ignore lint/suspicious/noThenProperty: JSON Schema uses then to define the matching conditional branch.
        then: { required: ['id', 'audit'] },
        else: { required: ['id', 'draft'] },
      }

      expect((await postPet({ NewPet: schema }, { name: 'Fido', draft: true })).status).toBe(201)
      expect((await postPet({ NewPet: schema }, { name: 'Fido', audit: true })).status).toBe(422)
      expect((await postPet({ NewPet: schema }, { id: 1, name: 'Fido', audit: true })).status).toBe(201)
      expect((await postPet({ NewPet: schema }, { id: 1, name: 'Fido', draft: true })).status).toBe(422)
    })

    it('preserves negated read-only requirements during request validation', async () => {
      const schema = {
        ...pet,
        not: { required: ['id'], properties: { id: { type: 'integer', readOnly: true } } },
      }

      expect((await postPet({ NewPet: schema }, { name: 'Fido' })).status).toBe(201)
      expect((await postPet({ NewPet: schema }, { id: 1, name: 'Fido' })).status).toBe(422)
      expect((await postPet({ NewPet: schema }, {})).status).toBe(422)
    })

    it('still requires the other properties', async () => {
      const response = await postPet({ NewPet: pet }, {})

      expect(response.status).toBe(422)
      expect(await response.json()).toMatchObject({
        violations: [{ location: 'body', message: "must have required property 'name'" }],
      })
    })
  })

  it('accepts exact decimal multiples in JSON bodies and rejects near multiples', async () => {
    const document = documentWith('/orders', 'post', {
      'x-handler': 'return req.body',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { price: { type: 'number', multipleOf: 0.01 } } },
          },
        },
      },
    })
    const server = await createMockServer({ document, logger: false })
    for (const price of [0, 0.07, 0.29, 1.1, 1.15, 4.35, 8.2, 19.99, -19.99, 1000000.19]) {
      const response = await server.request('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ price }),
      })
      expect(response.status, String(price)).toBe(200)
      expect(await response.json()).toStrictEqual({ price })
    }
    for (const price of [0.075, -0.075, 0.010000000001, 0.009999999999]) {
      const response = await server.request('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ price }),
      })
      expect(response.status, String(price)).toBe(422)
      expect(await response.json()).toStrictEqual({
        error: 'Request validation failed',
        violations: [{ location: 'body', path: '/price', message: 'must be multiple of 0.01' }],
      })
    }
    const stringPrice = await server.request('/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"price":"19.99"}',
    })
    expect(stringPrice.status).toBe(422)
    expect(await stringPrice.json()).toStrictEqual({
      error: 'Request validation failed',
      violations: [{ location: 'body', path: '/price', message: 'must be number' }],
    })
  })

  it.each(['query', 'path', 'header', 'cookie'] as const)(
    'validates decimal multiples in %s parameters',
    async (location) => {
      const document = documentWith(location === 'path' ? '/orders/{price}' : '/orders', 'get', {
        parameters: [{ name: 'price', in: location, required: true, schema: { type: 'number', multipleOf: 0.01 } }],
      })
      const server = await createMockServer({ document, logger: false })
      for (const [price, status] of [
        [19.99, 200],
        [-19.99, 200],
        [1000000.19, 200],
        [0.075, 422],
        [0.010000000001, 422],
      ] as const) {
        const response = await server.request(
          location === 'path' ? `/orders/${price}` : location === 'query' ? `/orders?price=${price}` : '/orders',
          {
            headers:
              location === 'header'
                ? { price: String(price) }
                : location === 'cookie'
                  ? { cookie: `price=${price}` }
                  : {},
          },
        )
        expect(response.status, String(price)).toBe(status)
        if (status === 422) {
          expect(await response.json()).toStrictEqual({
            error: 'Request validation failed',
            violations: [{ location, path: '/price', message: 'price must be multiple of 0.01' }],
          })
        }
      }
    },
  )

  it('validates decimal multiples in referenced array items', async () => {
    const document = {
      ...documentWith('/prices', 'post', {
        requestBody: {
          content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Price' } } } },
        },
      }),
      components: { schemas: { Price: { type: 'number', multipleOf: 0.01 } } },
    }
    const server = await createMockServer({ document, logger: false })
    const request = async (body: string): Promise<Response> =>
      await server.request('/prices', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
    expect((await request('[19.99,1000000.19]')).status).toBe(200)
    const invalid = await request('[19.99,0.010000000001]')
    expect(invalid.status).toBe(422)
    expect(await invalid.json()).toStrictEqual({
      error: 'Request validation failed',
      violations: [{ location: 'body', path: '/1', message: 'must be multiple of 0.01' }],
    })
  })
  describe('patterns that only parse without the unicode flag', () => {
    const ZIP_PATTERN = String.raw`^\d{5}(\-\d{4})?$`

    it.each([
      [{}, 422],
      [{ name: 'x', zip: '12345-6789' }, 200],
      [{ name: 'x', zip: '1234' }, 422],
    ])('keeps body validation on for %j', async (body, status) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const document = documentWith('/addresses', 'post', {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' }, zip: { type: 'string', pattern: ZIP_PATTERN } },
              },
            },
          },
        },
      })
      const server = await createMockServer({ document, validateRequest: true })

      const response = await server.request('/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(response.status).toBe(status)

      consoleErrorSpy.mockRestore()
    })

    it.each([
      ['/addresses', {}, 422],
      ['/addresses?limit=5', { 'X-Zip': '12345-6789' }, 200],
      ['/addresses?limit=5&zip=12345-6789', {}, 200],
      ['/addresses?limit=5&zip=1234', {}, 422],
      ['/addresses?limit=5', { 'X-Zip': '1234' }, 422],
    ])('keeps parameter validation on for %s with headers %j', async (url, headers, status) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const document = documentWith('/addresses', 'get', {
        parameters: [
          { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'zip', in: 'query', schema: { type: 'string', pattern: ZIP_PATTERN } },
          { name: 'X-Zip', in: 'header', schema: { type: 'string', pattern: ZIP_PATTERN } },
        ],
      })
      const server = await createMockServer({ document, validateRequest: true })

      const response = await server.request(url, { headers })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(response.status).toBe(status)

      consoleErrorSpy.mockRestore()
    })
  })

  it.each(['3.0.3', '3.0.4'])(
    'keeps body validation on for a nullable union in an OpenAPI %s document',
    async (openapi) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      const response = await postRecord(openapi, NULLABLE_SCHEMAS.oneOf, {})

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(response.status).toBe(422)
      expect((await response.json()).violations).toStrictEqual([
        { location: 'body', path: '/name', message: "must have required property 'name'" },
      ])

      consoleErrorSpy.mockRestore()
    },
  )

  it.each([
    ['oneOf', 'text', 200],
    ['oneOf', 3, 200],
    ['oneOf', null, 200],
    ['oneOf', true, 422],
    ['anyOf', 'text', 200],
    ['anyOf', null, 200],
    ['anyOf', true, 422],
    ['allOf', 'text', 200],
    ['allOf', null, 200],
    ['allOf', 3, 422],
    ['a nullable only schema', { any: 'thing' }, 200],
    ['a nullable only schema', null, 200],
    ['nullable false', 'text', 200],
    ['nullable false', null, 422],
  ] as const)('validates a property with %s next to nullable against %j', async (kind, value, status) => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await postRecord('3.0.3', NULLABLE_SCHEMAS[kind], { name: 'x', value })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(status)

    consoleErrorSpy.mockRestore()
  })

  it.each(['default', 'example', 'examples'])('validates a reusable request body named %s', async (name) => {
    const document = {
      ...documentWith('/records', 'post', { requestBody: { $ref: `#/components/requestBodies/${name}` } }),
      openapi: '3.0.4',
      components: {
        requestBodies: {
          [name]: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string' }, value: NULLABLE_SCHEMAS.oneOf },
                },
              },
            },
          },
        },
      },
    }
    const server = await createMockServer({ document, validateRequest: true })
    const post = async (body: unknown): Promise<Response> =>
      await server.request('/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

    expect((await post({})).status).toBe(422)
    expect((await post({ name: 'x', value: null })).status).toBe(200)
    expect((await post({ name: 'x', value: true })).status).toBe(422)
  })

  it.each(['oneOf', 'anyOf'] as const)('validates sibling exclusive bounds on a nullable %s', async (keyword) => {
    const schema = {
      nullable: true,
      [keyword]: [{ type: 'number' }],
      minimum: 0,
      maximum: 10,
      exclusiveMinimum: true,
      exclusiveMaximum: true,
    }

    expect((await postRecord('3.0.4', schema, {})).status).toBe(422)
    expect((await postRecord('3.0.4', schema, { name: 'x', value: null })).status).toBe(200)
    expect((await postRecord('3.0.4', schema, { name: 'x', value: 5 })).status).toBe(200)
    expect((await postRecord('3.0.4', schema, { name: 'x', value: 0 })).status).toBe(422)
    expect((await postRecord('3.0.4', schema, { name: 'x', value: 10 })).status).toBe(422)
  })

  it.each([
    ['a', 200],
    ['b', 422],
    [null, 422],
  ])('preserves an enum beside a nullable union for %j', async (value, status) => {
    const response = await postRecord('3.0.3', { ...NULLABLE_SCHEMAS.oneOf, enum: ['a'] }, { name: 'x', value })

    expect(response.status).toBe(status)
  })

  it.each([
    ['3.0.3', 'text', 200],
    ['3.0.3', null, 200],
    ['3.0.3', 3, 422],
    ['3.0.4', 'text', 200],
    ['3.0.4', null, 200],
    ['3.0.4', 3, 422],
  ])(
    'reads a oneOf arm that only says nullable as null in an OpenAPI %s document for %j',
    async (openapi, value, status) => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      const response = await postRecord(
        openapi,
        { oneOf: [{ nullable: true }, { type: 'string' }] },
        { name: 'x', value },
      )

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(response.status).toBe(status)

      consoleErrorSpy.mockRestore()
    },
  )

  it.each([
    ['null', { type: 'null' }],
    ['a list with null', { type: ['string', 'null'] }],
  ])('keeps body validation on for the native OpenAPI 3.1 type %s', async (_name, value) => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await postRecord('3.1.0', value, { name: 1 })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(422)

    consoleErrorSpy.mockRestore()
  })

  it('keeps validating every location of the operation', async () => {
    const document = documentWith('/records', 'get', {
      parameters: [
        { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
        { name: 'filter', in: 'query', schema: NULLABLE_SCHEMAS.anyOf },
      ],
    })
    document.openapi = '3.0.3'
    const server = await createMockServer({ document, validateRequest: true })

    expect((await server.request('/records')).status).toBe(422)
    expect((await server.request('/records?limit=5&filter=text')).status).toBe(200)
    expect((await server.request('/records?limit=nope&filter=text')).status).toBe(422)
  })

  it('keeps validating a JSON encoded property of a form querystring', async () => {
    const document = {
      ...documentWith('/records', 'get', {
        parameters: [
          {
            name: 'wholeQuery',
            in: 'querystring',
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  required: ['filter'],
                  properties: {
                    filter: {
                      anyOf: [
                        {
                          oneOf: [
                            { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
                            { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
                          ],
                        },
                        { type: 'null' },
                      ],
                    },
                  },
                },
                encoding: { filter: { contentType: 'application/json' } },
              },
            },
          },
        ] as never,
      }),
      openapi: '3.2.0',
    }
    const server = await createMockServer({ document, validateRequest: true })
    const get = async (query: string): Promise<Response> => await server.request(`/records?${query}`)
    const filter = (value: unknown): string => `filter=${encodeURIComponent(JSON.stringify(value))}`

    expect((await get(filter({ id: 1 }))).status).toBe(200)
    expect((await get(filter(null))).status).toBe(200)
    expect((await get(filter({ id: 'x' }))).status).toBe(422)
    expect((await get('other=1')).status).toBe(422)
  })

  it('still drops a required read-only property from a nullable union body', async () => {
    const document = documentWith('/records', 'post', {
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { readOnly: true, nullable: true, oneOf: [{ type: 'string' }, { type: 'integer' }] },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    })
    document.openapi = '3.0.3'
    const server = await createMockServer({ document, validateRequest: true })
    const post = async (body: unknown): Promise<Response> =>
      await server.request('/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

    expect((await post({ name: 'x' })).status).toBe(200)
    expect((await post({})).status).toBe(422)
  })
})
