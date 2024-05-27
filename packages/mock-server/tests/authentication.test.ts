import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/createMockServer'

describe('authentication', () => {
  it('doesn’t require authentication', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/public': {
          get: {
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/public')

    expect(response.status).toBe(200)
  })

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
                basicAuth: [],
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
          basicAuth: {
            type: 'http',
            scheme: 'basic',
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
                basicAuth: [],
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
          basicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/secret', {
      headers: {
        Authorization: `Basic ${Buffer.from(`demo:secret`).toString('base64')}`,
      },
    })

    expect(response.status).toBe(200)
  })
})
