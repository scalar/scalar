import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src'

/**
 * With lazy reference resolution, a `$ref` that cannot be resolved yields `undefined` at the
 * point of use instead of failing during processing. These tests make sure the mock server
 * degrades gracefully (skips the broken bit) rather than crashing at startup or per request.
 */
describe('unresolved references', () => {
  it('starts when a security scheme is an unresolvable $ref', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Broken refs', version: '1.0.0' },
      components: {
        // Points at a component that does not exist
        securitySchemes: { broken: { $ref: '#/components/securitySchemes/Missing' } },
      },
      paths: {
        '/planets': {
          get: {
            responses: { '200': { description: 'OK', content: { 'application/json': { example: { id: 1 } } } } },
          },
        },
      },
    }

    const server = await createMockServer({ document })
    const response = await server.request('/planets')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: 1 })
  })

  it('responds when a response header is an unresolvable $ref', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Broken header ref', version: '1.0.0' },
      paths: {
        '/planets': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                headers: { 'X-Broken': { $ref: '#/components/headers/Missing' } },
                content: { 'application/json': { example: { id: 1 } } },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })
    const response = await server.request('/planets')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ id: 1 })
  })
})
