import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src/createMockServer'
import { createOpenApiDefinition } from '../../src/utils/createOpenApiDefinition'

describe('Bearer Token Authentication', () => {
  it('succeeds with valid bearer token', async () => {
    const specification = createOpenApiDefinition({
      bearerAuth: { type: 'http', scheme: 'bearer' },
    })
    specification.paths = {
      '/bearer-test': {
        get: {
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/bearer-test', {
      headers: { Authorization: 'Bearer test-token' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('www-authenticate')).toBeNull()
  })

  it('fails without bearer token', async () => {
    const specification = createOpenApiDefinition({
      bearerAuth: { type: 'http', scheme: 'bearer' },
    })

    specification.paths = {
      '/bearer-test': {
        get: {
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } },
        },
      },
    }

    const server = await createMockServer({ specification })
    const response = await server.request('/bearer-test')

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe(
      'Bearer realm="Scalar Mock Server", error="invalid_token", error_description="The access token is invalid or has expired"',
    )

    const body = await response.json()

    expect(body).toMatchObject({ error: 'Unauthorized' })
  })
})
