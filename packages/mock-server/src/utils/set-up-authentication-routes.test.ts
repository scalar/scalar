import { describe, expect, it, vi } from 'vitest'

import { createMockServer } from '@/create-mock-server'

describe('set-up-authentication-routes', () => {
  it.each(['/custom/metadata', '/custom/metadata/'])(
    'serves OAuth2 metadata at %s and issues tokens locally',
    async (metadataPath) => {
      const server = await createMockServer({
        logger: false,
        document: {
          openapi: '3.2.1',
          info: { title: 'OAuth metadata', version: '1.0' },
          security: [{ oauth: ['read'] }],
          components: {
            securitySchemes: {
              oauth: {
                type: 'oauth2',
                oauth2MetadataUrl: `https://real.example.com${metadataPath}`,
                flows: {
                  clientCredentials: { tokenUrl: 'https://real.example.com/oauth/token', scopes: { read: 'Read' } },
                },
              },
            },
          },
          paths: { '/pets': { get: { responses: { '200': { description: 'OK' } } } } },
        },
      })
      const response = await server.request(`https://mock.example.com${metadataPath}`)
      expect(response.status).toBe(200)
      expect(await response.json()).toStrictEqual({
        issuer: 'https://mock.example.com',
        token_endpoint: 'https://mock.example.com/oauth/token',
        response_types_supported: [],
        grant_types_supported: ['client_credentials'],
        scopes_supported: ['read'],
      })
      const tokenResponse = await server.request('https://mock.example.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials&client_id=example&client_secret=example',
      })
      expect(tokenResponse.status).toBe(200)
      expect((await tokenResponse.json()).access_token).toBe('super-secret-access-token')
      const protectedResponse = await server.request('/pets')
      expect(protectedResponse.status).toBe(401)
      const authorizedResponse = await server.request('/pets', {
        headers: { Authorization: 'Bearer super-secret-access-token' },
      })
      expect(authorizedResponse.status).toBe(200)
      const documentResponse = await server.request('/openapi.json')
      expect((await documentResponse.json()).components.securitySchemes.oauth.oauth2MetadataUrl).toBe(
        `https://real.example.com${metadataPath}`,
      )
    },
  )

  it('supports relative metadata URLs and referenced security schemes', async () => {
    const server = await createMockServer({
      logger: false,
      document: {
        openapi: '3.2.1',
        info: { title: 'Referenced OAuth', version: '1.0' },
        paths: {},
        components: {
          securitySchemes: {
            oauth: { $ref: '#/components/securitySchemes/base' },
            base: {
              type: 'oauth2',
              oauth2MetadataUrl: '/.well-known/oauth-authorization-server',
              flows: {
                implicit: { authorizationUrl: '/authorize', scopes: {} },
              },
            },
          },
        },
      },
    })
    const response = await server.request('https://mock.example.com/.well-known/oauth-authorization-server')
    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({
      issuer: 'https://mock.example.com',
      authorization_endpoint: 'https://mock.example.com/authorize',
      response_types_supported: ['token'],
      grant_types_supported: ['implicit'],
      scopes_supported: [],
    })
    const authorization = await server.request(
      '/authorize?response_type=token&redirect_uri=https://app.example.com/callback',
    )
    expect(authorization.status).toBe(200)
  })

  it('warns when metadata collides with a declared API path', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await createMockServer({
        logger: false,
        document: {
          openapi: '3.2.1',
          info: { title: 'Collision', version: '1.0' },
          paths: { '/pets': { get: { responses: { '200': { description: 'OK' } } } } },
          components: { securitySchemes: { oauth: { type: 'oauth2', flows: {}, oauth2MetadataUrl: '/pets' } } },
        },
      })
      expect(warning).toHaveBeenCalledExactlyOnceWith(
        'OAuth2 metadata route "/pets" collides with a declared API path.',
      )
    } finally {
      warning.mockRestore()
    }
  })

  it('does not register metadata routes when the field is absent', async () => {
    const server = await createMockServer({
      logger: false,
      document: {
        openapi: '3.2.1',
        info: { title: 'OAuth', version: '1.0' },
        paths: {},
        components: { securitySchemes: { oauth: { type: 'oauth2', flows: {} } } },
      },
    })
    expect((await server.request('/.well-known/oauth-authorization-server')).status).toBe(404)
  })
})
