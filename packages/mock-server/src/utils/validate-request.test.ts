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
})
