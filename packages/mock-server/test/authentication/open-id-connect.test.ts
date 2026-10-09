import { describe, expect, it } from 'vitest'

import { createMockServer } from '../../src'
import { createOpenApiDefinition } from '../../src/utils/create-openapi-definition'

describe('OpenID Connect', () => {
  const document = createOpenApiDefinition({
    openIdConnect: {
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  })

  document.paths = {
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
    const server = await createMockServer({ document })
    const response = await server.request('/.well-known/openid-configuration')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      issuer: 'http://localhost',
      authorization_endpoint: 'http://localhost/oauth/authorize',
      token_endpoint: 'http://localhost/oauth/token',
      jwks_uri: 'http://localhost/oauth/jwks',
      userinfo_endpoint: 'http://localhost/oauth/userinfo',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['openid', 'profile', 'email'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    })
  })

  it('succeeds with valid OAuth token', async () => {
    const server = await createMockServer({ document })

    const response = await server.request('/oauth-test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.status).toBe(200)
  })

  it('succeeds with valid OAuth token for scoped endpoint', async () => {
    const server = await createMockServer({ document })

    const response = await server.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(response.status).toBe(200)
  })

  it('fails without OAuth token', async () => {
    const server = await createMockServer({ document })
    const response = await server.request('/oauth-test')

    expect(response.status).toBe(401)
  })
})
