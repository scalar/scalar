import { describe, expect, it } from 'vitest'

import { createMockServer } from './create-mock-server'

describe('createMockServer', () => {
  it('supports deprecated specification key', async () => {
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

    const server = await createMockServer({ specification })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('GET /foobar -> example JSON', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(await response.text()).toBe('{"foo":"bar"}')
  })

  it('GET /foobar -> compact NDJSON example', async () => {
    const document = {
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
                  'application/x-ndjson': {
                    example: {
                      foo: 'bar',
                      count: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')
    expect(await response.text()).toBe('{"foo":"bar","count":1}')
  })

  it('GET /foobar -> compact JSONL schema-generated body', async () => {
    const document = {
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
                  'application/jsonl': {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/jsonl')
    expect(await response.text()).toBe('{"foo":"bar"}')
  })

  it('GET /foobar -> omits writeOnly properties in responses', async () => {
    const document = {
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

    const server = await createMockServer({ document })

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
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar', {
      headers: {
        Accept: 'text/html',
      },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('foobar')
  })

  it('GET /foobar -> fall back to JSON', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('GET /foobar -> XML', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('<foo>bar</foo>')
  })

  it('uses http verbs only to register routes', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar -> example JSON', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar', {
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar -> return 201', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar', {
      method: 'POST',
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar/{id} -> example JSON', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar/123')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('POST /foobar/{id} -> uses dynamic ID', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar/123')

    expect(await response.json()).toMatchObject({
      id: 123,
    })
    expect(response.status).toBe(200)
  })

  it('GET /foobar -> example from schema', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('GET /foobar -> wraps schema examples for array responses', async () => {
    const document = {
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
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          foo: {
                            type: 'string',
                          },
                        },
                      },
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
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual([
      {
        foo: 'bar',
      },
    ])
  })

  it('GET /foobar -> wraps media type examples for array responses', async () => {
    const document = {
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
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          foo: {
                            type: 'string',
                          },
                        },
                      },
                    },
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual([
      {
        foo: 'bar',
      },
    ])
  })

  it('GET /foobar/{id} -> example from schema', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar/123')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      foo: 'bar',
    })
  })

  it('DELETE /foobar -> return 204', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          delete: {
            responses: {
              '204': {
                description: 'OK',
                content: {
                  'application/json': {},
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/foobar', {
      method: 'DELETE',
    })

    expect(response.status).toBe(204)
  })

  it('has CORS headers', async () => {
    const document = {
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

    const server = await createMockServer({ document })

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
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Custom')).toBe('foobar')
  })

  it('returns implicit flow redirect URL with token fragment', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          oAuth2Implicit: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: '/oauth/authorize',
                scopes: {
                  read: 'Read access',
                },
              },
            },
          },
        },
      },
      paths: {},
    }

    const server = await createMockServer({ document })
    const redirectUri = 'https://example.com/callback'
    const response = await server.request(
      `/oauth/authorize?response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read&state=abc123`,
    )
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(
      'href="https://example.com/callback#access_token=super-secret-access-token&token_type=Bearer&expires_in=3600&scope=read&state=abc123"',
    )
    expect(html).toContain(
      'href="https://example.com/callback#error=access_denied&error_description=User+has+denied+the+authorization+request&state=abc123"',
    )
  })

  it('returns authorization code redirect URL for auth code flow', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          oAuth2AuthCode: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: '/oauth/authorize',
                tokenUrl: '/oauth/token',
                scopes: {
                  read: 'Read access',
                },
              },
            },
          },
        },
      },
      paths: {},
    }

    const server = await createMockServer({ document })
    const redirectUri = 'https://example.com/callback'
    const response = await server.request(
      `/oauth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=abc123`,
    )
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain('href="https://example.com/callback?code=super-secret-token&state=abc123"')
    expect(html).toContain(
      'href="https://example.com/callback?state=abc123&error=access_denied&error_description=User+has+denied+the+authorization+request"',
    )
  })

  it('supports oauth2 refresh token endpoint via refreshUrl', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          oAuth2AuthCode: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: '/oauth/authorize',
                tokenUrl: '/oauth/token',
                refreshUrl: '/oauth/refresh',
                scopes: {
                  read: 'Read access',
                },
              },
            },
          },
        },
      },
      paths: {},
    }

    const server = await createMockServer({ document })
    const response = await server.request('/oauth/refresh?grant_type=refresh_token', { method: 'POST' })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toStrictEqual({
      access_token: 'super-secret-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'example-refresh-token',
    })
  })

  it('handles redirect headers', async () => {
    const document = {
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

    const server = await createMockServer({ document })

    const response = await server.request('/redirect')

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe('/new-location')
  })

  describe('path keys with a query string', () => {
    /** Build a JSON response that echoes a single marker string. */
    const jsonResponse = (variant: string) => ({
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            example: { variant },
          },
        },
      },
    })

    it('routes a path key with a query string separately from its plain sibling', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages': {
            get: { responses: jsonResponse('plain') },
          },
          '/v1/messages?beta=true': {
            get: { responses: jsonResponse('beta') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'plain' })
      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({ variant: 'beta' })
      // A different value does not qualify for the variant, so the plain operation answers.
      expect(await (await server.request('/v1/messages?beta=false')).json()).toStrictEqual({ variant: 'plain' })
    })

    it('routes a path key with a query string when the plain sibling comes first in the document', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?beta=true': {
            get: { responses: jsonResponse('beta') },
          },
          '/v1/messages': {
            get: { responses: jsonResponse('plain') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({ variant: 'beta' })
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'plain' })
    })

    it('answers without the query string when a route has no plain path key', async () => {
      // A query string in a path key tells two operations apart rather than describing something a
      // client has to send, so the operation still answers its documented URL.
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?beta=true': {
            get: { responses: jsonResponse('beta') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({ variant: 'beta' })
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'beta' })
    })

    it('answers with the least specific path key when a route has no plain path key', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?beta=true': {
            get: { responses: jsonResponse('beta') },
          },
          '/v1/messages?beta=true&version=2': {
            get: { responses: jsonResponse('beta-v2') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages?beta=true&version=2')).json()).toStrictEqual({
        variant: 'beta-v2',
      })
      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({ variant: 'beta' })
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'beta' })
    })

    it('keeps the document order of path keys that do not share a route', async () => {
      // Only keys sharing a route compete, so hoisting a query-bearing key must not let a templated
      // path key overtake a static one declared before it.
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/work/stats': {
            get: { responses: jsonResponse('stats') },
          },
          '/v1/work/{id}?beta=true': {
            get: { responses: jsonResponse('by-id') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/work/stats')).json()).toStrictEqual({ variant: 'stats' })
      expect(await (await server.request('/v1/work/stats?beta=true')).json()).toStrictEqual({ variant: 'stats' })
      expect(await (await server.request('/v1/work/7?beta=true')).json()).toStrictEqual({ variant: 'by-id' })
    })

    it('keeps the document order when a query-bearing path key is declared first', async () => {
      // The templated route is opened by the beta key, but the key that answers a request without a
      // query string is declared after the static one — so the static one still wins.
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/pets/{id}?beta=true': {
            get: { responses: jsonResponse('by-id-beta') },
          },
          '/pets/mine': {
            get: { responses: jsonResponse('mine') },
          },
          '/pets/{id}': {
            get: { responses: jsonResponse('by-id') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/pets/mine')).json()).toStrictEqual({ variant: 'mine' })
      expect(await (await server.request('/pets/7')).json()).toStrictEqual({ variant: 'by-id' })
      expect(await (await server.request('/pets/7?beta=true')).json()).toStrictEqual({ variant: 'by-id-beta' })
    })

    it('falls back to the path key declared first when the query parameter counts tie', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?a=1': {
            get: { responses: jsonResponse('a') },
          },
          '/v1/messages?b=2': {
            get: { responses: jsonResponse('b') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages?a=1')).json()).toStrictEqual({ variant: 'a' })
      expect(await (await server.request('/v1/messages?b=2')).json()).toStrictEqual({ variant: 'b' })
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'a' })
    })

    it('routes a path key whose query parameter is named after an object member', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?__proto__=1': {
            get: { responses: jsonResponse('inherited') },
          },
          '/v1/messages?toString=1': {
            get: { responses: jsonResponse('stringified') },
          },
          '/v1/messages': {
            get: { responses: jsonResponse('plain') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'plain' })
      expect(await (await server.request('/v1/messages?__proto__=1')).json()).toStrictEqual({ variant: 'inherited' })
      expect(await (await server.request('/v1/messages?toString=1')).json()).toStrictEqual({
        variant: 'stringified',
      })
    })

    it('keeps a path key ahead of a route declared after it', async () => {
      // The beta key is declared before the templated route, so it has to answer a request carrying
      // its query string even though the key it shares a route with comes last.
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/a/mine?v=1': {
            get: { responses: jsonResponse('mine-beta') },
          },
          '/a/{id}': {
            get: { responses: jsonResponse('by-id') },
          },
          '/a/mine': {
            get: { responses: jsonResponse('mine') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/a/mine?v=1')).json()).toStrictEqual({ variant: 'mine-beta' })
      // `/a/{id}` is declared before `/a/mine`, so it answers everything else, as it would without
      // the beta key in the document.
      expect(await (await server.request('/a/mine')).json()).toStrictEqual({ variant: 'by-id' })
      expect(await (await server.request('/a/7')).json()).toStrictEqual({ variant: 'by-id' })
    })

    it('runs the handlers of a fallback path key once per request', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?beta=true': {
            get: { operationId: 'listBetaMessages', responses: jsonResponse('beta') },
          },
        },
      }

      const operationIds: Array<string | undefined> = []

      const server = await createMockServer({
        document,
        onRequest: ({ operation }) => {
          operationIds.push(operation.operationId)
        },
      })

      // The fallback puts the same handlers on the route a second time, so a request that reaches it
      // must not notify twice.
      await server.request('/v1/messages')
      await server.request('/v1/messages?beta=true')

      expect(operationIds).toStrictEqual(['listBetaMessages', 'listBetaMessages'])
    })

    it('does not crash on a path key whose query parameter has no name', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages?=1': {
            get: { responses: jsonResponse('nameless') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'nameless' })
    })

    it('routes sibling path keys that all carry a query string', async () => {
      // Two path keys whose routes overlap used to reach Hono with the `?` intact, where the router
      // read it as a quantifier and threw while building the matcher on the very first request.
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/a/{x}/b?q=1': {
            get: { responses: jsonResponse('list') },
          },
          '/a/{x}/b/{y}?q=1': {
            get: { responses: jsonResponse('item') },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/a/1/b?q=1')).json()).toStrictEqual({ variant: 'list' })
      expect(await (await server.request('/a/1/b/2?q=1')).json()).toStrictEqual({ variant: 'item' })
      expect(await (await server.request('/a/1/b')).json()).toStrictEqual({ variant: 'list' })
    })

    it('keeps path parameters of a path key with a query string', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages/{id}?beta=true': {
            get: {
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
              responses: jsonResponse('beta'),
            },
          },
        },
      }

      const parameters: Array<Record<string, string>> = []

      const server = await createMockServer({
        document,
        onRequest: ({ context }) => {
          parameters.push(context.req.param())
        },
      })

      expect(await (await server.request('/v1/messages/123?beta=true')).json()).toStrictEqual({ variant: 'beta' })
      expect(parameters).toStrictEqual([{ id: '123' }])
    })

    it('applies authentication of the path key that answers', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          securitySchemes: {
            bearer: { type: 'http', scheme: 'bearer' },
          },
        },
        paths: {
          '/v1/messages': {
            get: { responses: jsonResponse('plain') },
          },
          '/v1/messages?beta=true': {
            get: { security: [{ bearer: [] }], responses: jsonResponse('beta') },
          },
        },
      }

      const server = await createMockServer({ document })

      // The authentication of the beta operation must not reach the plain one, or the other way round.
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ variant: 'plain' })
      expect((await server.request('/v1/messages?beta=true')).status).toBe(401)
      expect(
        await (await server.request('/v1/messages?beta=true', { headers: { Authorization: 'Bearer token' } })).json(),
      ).toStrictEqual({ variant: 'beta' })
    })

    it('notifies onRequest once, with the operation that answers', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages': {
            get: { operationId: 'listMessages', responses: jsonResponse('plain') },
          },
          '/v1/messages?beta=true': {
            get: { operationId: 'listBetaMessages', responses: jsonResponse('beta') },
          },
        },
      }

      const operationIds: Array<string | undefined> = []

      const server = await createMockServer({
        document,
        onRequest: ({ operation }) => {
          operationIds.push(operation.operationId)
        },
      })

      await server.request('/v1/messages?beta=true')
      await server.request('/v1/messages')
      await server.request('/v1/messages?beta=false')

      expect(operationIds).toStrictEqual(['listBetaMessages', 'listMessages', 'listMessages'])
    })
  })
})
