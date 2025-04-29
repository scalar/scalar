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

  it('GET /foobar -> omits writeOnly properties in responses', async () => {
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
                        id: {
                          type: 'integer',
                          format: 'int64',
                          readOnly: true,
                          example: 1,
                        },
                        visible: {
                          type: 'boolean',
                          example: true,
                        },
                        password: {
                          type: 'string',
                          writeOnly: true,
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

    const data = await response.json()

    expect(data).not.toHaveProperty('password')
    expect(data).toStrictEqual({
      id: 1,
      visible: true,
    })
  })

  it('GET /foobar -> return HTML if accepted', async () => {
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
                  'text/html': {
                    example: 'foobar',
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
      headers: {
        Accept: 'text/html',
      },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('foobar')
  })

  it('GET /foobar -> fall back to JSON', async () => {
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
                  'text/html': {
                    example: 'foobar',
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

  it('GET /foobar -> XML', async () => {
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
                  'application/xml': {
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
    expect(await response.text()).toContain('<foo>bar</foo>')
  })

  it('uses http verbs only to register routes', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          summary: '',
          description: '',
          parameters: {},
          servers: {},
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

    const allowMethodsHeader = response.headers.get('Access-Control-Allow-Methods')
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

  it('adds headers', async () => {
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
                headers: {
                  'X-Custom': {
                    schema: {
                      type: 'string',
                      example: 'foobar',
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
    expect(response.headers.get('X-Custom')).toBe('foobar')
  })

  it('handles redirect headers', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/redirect': {
          get: {
            responses: {
              '301': {
                description: 'Moved Permanently',
                headers: {
                  Location: {
                    schema: {
                      type: 'string',
                      example: '/new-location',
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

    const response = await server.request('/redirect')

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe('/new-location')
  })
})
