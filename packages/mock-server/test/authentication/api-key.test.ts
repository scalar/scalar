import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src'
import { createOpenApiDefinition } from '../../src/utils/create-openapi-definition'

describe('API Key Authentication', () => {
  it('succeeds with API key in header', async () => {
    const document = createOpenApiDefinition({
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
    document.paths = {
      '/api-key-test': {
        get: {
          security: [{ apiKey: [] }],
          responses: { '200': { description: 'OK', content: { 'application/json': { example: { foo: 'bar' } } } } },
        },
      },
    }

    const server = await createMockServer({ document })
    const response = await server.request('/api-key-test', {
      headers: { 'X-API-Key': 'test-api-key' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('fails without API key in header', async () => {
    const document = createOpenApiDefinition({
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
    document.paths = {
      '/api-key-test': {
        get: {
          security: [{ apiKey: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ document })
    const response = await server.request('/api-key-test')

    expect(response.status).toBe(401)
  })
})
