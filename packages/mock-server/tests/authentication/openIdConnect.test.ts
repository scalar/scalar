import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src/createMockServer'
import { createOpenApiDefinition } from '../../src/utils/createOpenApiDefinition'

describe('OpenID Connect', () => {
  const specification = createOpenApiDefinition({
    openIdConnect: {
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  })

  specification.paths = {
    '/oauth-test': {
      get: {
        security: [{ openIdConnect: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/protected': {
      get: {
        security: [{ openIdConnect: ['profile', 'email'] }],
        responses: { '200': { description: 'OK' } },
      },
    },
  }

  it('returns OpenID configuration', async () => {
    const server = await createMockServer({ specification })
    const response = await server.request('/.well-known/openid-configuration')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      issuer: 'https://example.com',
      authorization_endpoint: '/oauth/authorize',
      token_endpoint: '/oauth/token',
      response_types_supported: ['code', 'token', 'id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    })
  })

  it('succeeds with valid OAuth token', async () => {
    const server = await createMockServer({ specification })

    const response = await server.request('/oauth-test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.status).toBe(200)
  })

  it('succeeds with valid OAuth token for scoped endpoint', async () => {
    const server = await createMockServer({ specification })

    const response = await server.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.status).toBe(200)
  })

  it('fails without OAuth token', async () => {
    const server = await createMockServer({ specification })
    const response = await server.request('/oauth-test')

    expect(response.status).toBe(401)
  })
})
