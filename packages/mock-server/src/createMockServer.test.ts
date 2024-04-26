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
})
