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
    expect((await arrayServer.request('/items/.1.2.3')).status).toBe(200)
    // A single element cannot meet `minItems: 2`, proving the dot-list is parsed as an array.
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

  it('validates and delivers a JSON body sent without a Content-Type header', async () => {
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

    // A string body would default to `text/plain`, so drop the header to exercise the absent case.
    const withoutContentType = (body: string) => {
      const request = new Request('http://localhost/items', { method: 'POST', body })
      request.headers.delete('Content-Type')
      return request
    }

    // No Content-Type header: validation must reject an invalid body...
    const invalid = await server.request(withoutContentType(JSON.stringify({})))
    expect(invalid.status).toBe(422)
    expect((await invalid.json()).violations[0]).toMatchObject({ location: 'body' })

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
})
