import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src/createMockServer'
import { createOpenAPIDocument } from '../../src/utils/createOpenAPIDocument'

describe('API Key Authentication', () => {
  it('succeeds with API key in header', async () => {
    const specification = createOpenAPIDocument({
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
    specification.paths = {
      '/api-key-test': {
        get: {
          security: [{ apiKey: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/api-key-test', {
      headers: { 'X-API-Key': 'test-api-key' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=UTF-8',
    )
    expect(await response.json()).toEqual(expect.any(Object))
  })

  it('fails without API key in header', async () => {
    const specification = createOpenAPIDocument({
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
    specification.paths = {
      '/api-key-test': {
        get: {
          security: [{ apiKey: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/api-key-test')

    expect(response.status).toBe(401)
  })
})
