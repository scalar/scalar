import { describe, expect, it } from 'vitest'

import { createMockServer } from './createMockServer'

describe('createMockServer', () => {
  it('GET /foobar -> example JSON', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      foo: 'bar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar -> example JSON', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          post: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      foo: 'bar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar', {
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar -> return 201', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          post: {
            responses: {
              '201': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      foo: 'bar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar', {
      method: 'POST',
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar/{id} -> example JSON', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar/{id}': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      foo: 'bar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar/123')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar/{id} -> uses dynamic ID', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar/{id}': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          'type': 'number',
                          'example': 'bar',
                          'x-variable': 'id',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar/123')

    expect(await response.json()).toMatchObject({
      id: 123,
    })
    expect(response.status).toBe(200)
  })

  it('GET /foobar -> example from schema', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
                          type: 'string',
                          example: 'bar',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('GET /foobar/{id} -> example from schema', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar/{id}': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        foo: {
                          type: 'string',
                          example: 'bar',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/foobar/123')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('has CORS headers', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: {
                      foo: 'bar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({
      specification,
    })

    // Options request
    let response = await server.request('/foobar', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://example.com',
      },
    })

    expect(response.status).toBe(204)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')

    const allowMethodsHeader = response.headers.get(
      'Access-Control-Allow-Methods',
    )
    expect(allowMethodsHeader).toBeTypeOf('string')
    expect(allowMethodsHeader?.split(',').sort()).toStrictEqual(
      ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'].sort(),
    )

    // Get request
    response = await server.request('/foobar', {
      headers: {
        origin: 'https://example.com',
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')

    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })
})
