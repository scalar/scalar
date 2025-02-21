import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src/createMockServer'
import { createOpenApiDefinition } from '../../src/utils/createOpenApiDefinition'

describe('HTTP Basic Authentication', () => {
  it('succeeds with valid basic auth credentials', async () => {
    const specification = createOpenApiDefinition({
      basicAuth: { type: 'http', scheme: 'basic' },
    })
    specification.paths = {
      '/basic-auth-test': {
        get: {
          security: [{ basicAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/basic-auth-test', {
      headers: { Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=' },
    })

    expect(response.status).toBe(200)
  })

  it('fails without basic auth credentials', async () => {
    const specification = createOpenApiDefinition({
      basicAuth: { type: 'http', scheme: 'basic' },
    })
    specification.paths = {
      '/basic-auth-test': {
        get: {
          security: [{ basicAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/basic-auth-test')

    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="Scalar Mock Server", charset="UTF-8"')
    expect(await response.json()).toMatchObject({
      error: expect.any(String),
    })
  })
})
