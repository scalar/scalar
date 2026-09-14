import { describe, expect, it } from 'vitest'

import { createMockServer } from './create-mock-server'

describe('create-mock-server additional operations', () => {
  it('preserves method casing through routing, references, pinned queries, and CORS', async () => {
    const operation = (value: string): Record<string, unknown> => ({
      responses: { '200': { description: 'OK', content: { 'application/json': { example: value } } } },
    })
    const app = await createMockServer({
      document: {
        openapi: '3.2.1',
        info: { title: 'Additional operations', version: '1.0' },
        paths: {
          '/pets/{id}': { $ref: '#/components/pathItems/pets' },
          '/pets/{id}?variant=yes': { additionalOperations: { copy: operation('variant') } },
        },
        components: {
          pathItems: {
            pets: {
              get: operation('GET'),
              additionalOperations: {
                COPY: operation('COPY'),
                copy: operation('copy'),
                customMethod: operation('customMethod'),
              },
            },
          },
        },
      },
    })
    for (const method of ['GET', 'COPY', 'copy', 'customMethod']) {
      const response = await app.request('/pets/1', { method })
      expect(response.status).toBe(200)
      expect(await response.json()).toBe(method)
    }
    expect(await (await app.request('/pets/1?variant=yes', { method: 'copy' })).json()).toBe('variant')
    expect((await app.request('/pets/1', { method: 'CUSTOMMETHOD' })).status).toBe(404)
    const preflight = await app.request('/pets/1', {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'customMethod' },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET,HEAD,PUT,POST,DELETE,PATCH,COPY,copy,customMethod',
    )
  })

  it('validates custom operations and reports the selected operation to onRequest', async () => {
    const observed: string[] = []
    const app = await createMockServer({
      document: {
        openapi: '3.2.1',
        info: { title: 'Additional operations', version: '1.0' },
        paths: {
          '/pets': {
            additionalOperations: {
              COPY: {
                operationId: 'copyPets',
                parameters: [{ name: 'destination', in: 'query', required: true, schema: { type: 'string' } }],
                responses: { '204': { description: 'Copied' } },
              },
            },
          },
        },
      },
      onRequest: ({ operation }) => {
        observed.push(operation.operationId ?? '')
      },
    })
    expect((await app.request('/pets', { method: 'COPY' })).status).toBe(422)
    expect((await app.request('/pets?destination=archive', { method: 'COPY' })).status).toBe(204)
    expect(observed).toStrictEqual(['copyPets', 'copyPets'])
  })
  it('applies authentication before executing an additional operation handler', async () => {
    const app = await createMockServer({
      logger: false,
      document: {
        openapi: '3.2.1',
        info: { title: 'Additional operations', version: '1.0' },
        components: { securitySchemes: { token: { type: 'apiKey', in: 'header', name: 'X-Token' } } },
        paths: {
          '/pets/{id}': {
            additionalOperations: {
              copy: {
                security: [{ token: [] }],
                'x-handler': 'return { copied: req.params.id }',
                responses: { '200': { description: 'Copied' } },
              },
            },
          },
        },
      },
    })
    expect((await app.request('/pets/123', { method: 'copy' })).status).toBe(401)
    const response = await app.request('/pets/123', { method: 'copy', headers: { 'X-Token': 'test' } })
    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ copied: '123' })
  })
})
