import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/createMockServer'

describe.skip('oAuthPasswordGrant', () => {
  it('fails without credentials', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/secret': {
          get: {
            security: [
              {
                passwordGrant: [],
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          passwordGrant: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: '/oauth/token',
                scopes: {},
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/secret')

    expect(response.status).toBe(401)
  })

  it('responds with a token', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/secret': {
          get: {
            security: [
              {
                passwordGrant: [],
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          passwordGrant: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: '/my-custom-token-endpoint',
                scopes: {},
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/my-custom-token-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: 'foo',
        password: 'bar',
        client_id: 'my-client-id',
        client_secret: 'my-client-secret',
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: expect.any(String),
    })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('succeeds with credentials', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/secret': {
          get: {
            security: [
              {
                passwordGrant: [],
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          passwordGrant: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: '/oauth/token',
                scopes: {},
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/secret', {
      headers: {
        Authorization: `Bearer super-secret-token`,
      },
    })

    expect(response.status).toBe(200)
  })
})
