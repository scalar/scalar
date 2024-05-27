import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/createMockServer'

describe('authentication', () => {
  it('fails without credentials', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      security: [
        {
          basicAuth: [],
        },
      ],
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
            schema: 'basic',
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
      security: [
        {
          basicAuth: [],
        },
      ],
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
            schema: 'basic',
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/secret', {
      headers: {
        Authorization: `Basic ${btoa(`demo:secret`)}`,
      },
    })

    expect(response.status).toBe(200)
  })
})
