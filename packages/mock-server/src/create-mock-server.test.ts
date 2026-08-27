import { HTTPException } from 'hono/http-exception'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockServer } from './create-mock-server'

/**
 * A document with a single operation. Pass an `operationId` to have the document declare one; leave
 * it off to cover the case where it does not.
 */
const documentWithOnePet = (operationId?: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/pets/{petId}': {
      get: {
        ...(operationId ? { operationId } : {}),
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
})

/**
 * A response header name that is not a valid HTTP token. Building the response throws while the
 * mock handler runs, which is how a valid-looking document realistically produces a `500`: nothing
 * validates the header name up front, so the failure only surfaces on the request.
 */
const documentWithBrokenResponseHeader: Record<string, unknown> = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/pets/{petId}': {
      get: {
        operationId: 'getPet',
        responses: {
          '200': {
            description: 'OK',
            headers: {
              'X Invalid Name': {
                schema: {
                  type: 'string',
                  example: 'nope',
                },
              },
            },
          },
        },
      },
    },
  },
}

describe('createMockServer', () => {
  // The error-handling tests below silence the log the server writes. Restoring through a hook
  // rather than inline keeps a failing assertion from leaving `console.error` mocked for the rest
  // of the file.
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('GET /events -> frames a schema-generated text/event-stream response', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          example: 'edit',
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

    const response = await server.request('/events')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(await response.text()).toBe('data: {"type":"edit"}\n\ndata: {"type":"edit"}\n\ndata: {"type":"edit"}\n\n')
  })

  it('GET /events -> emits one event per named example', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    examples: {
                      summary: { value: { total_rows: 2 } },
                      row: { value: { count: 42 } },
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

    const response = await server.request('/events')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('data: {"total_rows":2}\n\ndata: {"count":42}\n\n')
  })

  it('GET /events -> picks a single event with Prefer: example', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    examples: {
                      summary: { value: { total_rows: 2 } },
                      row: { value: { count: 42 } },
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

    const response = await server.request('/events', {
      headers: { Prefer: 'example=row' },
    })

    expect(await response.text()).toBe('data: {"count":42}\n\n')
  })

  it('GET /events -> writes an already framed example verbatim', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    schema: {
                      type: 'object',
                      properties: { type: { type: 'string' } },
                    },
                    example: 'data: {"type":"edit"}\n\n',
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/events')

    expect(await response.text()).toBe('data: {"type":"edit"}\n\n')
  })

  it('GET /events -> frames a multi-item array schema as its own sequence', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    schema: {
                      type: 'array',
                      example: [{ type: 'edit' }, { type: 'delete' }],
                      items: {
                        type: 'object',
                        properties: { type: { type: 'string' } },
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

    const response = await server.request('/events')

    expect(await response.text()).toBe('data: {"type":"edit"}\n\ndata: {"type":"delete"}\n\n')
  })

  it('GET /events -> splits a multi-line payload across data lines', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': { example: 'user created\nid: 42' },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/events')

    expect(await response.text()).toBe('data: user created\ndata: id: 42\n\n')
  })

  it('GET /events -> keeps the status code and declared headers of the streamed response', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': { example: { from: '200' } },
                },
              },
              '201': {
                description: 'Created',
                headers: {
                  'X-Stream-Id': {
                    schema: {
                      type: 'string',
                      example: 'stream-1',
                    },
                  },
                },
                content: {
                  'text/event-stream': { example: { from: '201' } },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const response = await server.request('/events', {
      headers: { Prefer: 'code=201' },
    })

    expect(response.status).toBe(201)
    expect(response.headers.get('X-Stream-Id')).toBe('stream-1')
    expect(await response.text()).toBe('data: {"from":"201"}\n\n')
  })

  it('GET /events -> keeps returning a buffered body for the JSON variant', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/events': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    example: { type: 'edit' },
                  },
                  'text/event-stream': {
                    example: { type: 'edit' },
                  },
                },
              },
            },
          },
        },
      },
    }

    const server = await createMockServer({ document })

    const json = await server.request('/events', { headers: { Accept: 'application/json' } })
    expect(json.headers.get('Content-Type')).toBe('application/json')
    expect(await json.text()).toBe('{"type":"edit"}')

    const stream = await server.request('/events', { headers: { Accept: 'text/event-stream' } })
    expect(stream.headers.get('Content-Type')).toBe('text/event-stream')
    expect(await stream.text()).toBe('data: {"type":"edit"}\n\n')
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

  it('GET /foobar -> JSON-encodes a string schema body', async () => {
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
                      type: 'string',
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
    expect(await response.text()).toBe('"string"')
  })

  it('GET /foobar -> JSON-encodes a string enum body', async () => {
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
                      type: 'string',
                      enum: ['available', 'pending', 'sold'],
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
    expect(await response.text()).toBe('"available"')
  })

  it('GET /foobar -> JSON-encodes a formatted string body', async () => {
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
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-01T00:00:00Z',
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
    expect(await response.text()).toBe('"2024-01-01T00:00:00Z"')
  })

  it('GET /foobar -> JSON-encodes a string body for a suffixed JSON media type', async () => {
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
              '400': {
                description: 'Bad Request',
                content: {
                  'application/problem+json': {
                    example: 'something went wrong',
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

    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/problem+json')
    expect(await response.text()).toBe('"something went wrong"')
  })

  it('GET /foobar -> keeps a pre-serialized JSON example raw', async () => {
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
                        },
                      },
                    },
                    example: '{"foo":"bar"}',
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
    expect(await response.json()).toStrictEqual({ foo: 'bar' })
  })

  it('GET /foobar -> keeps a line-delimited JSON string body raw', async () => {
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
                    example: '{"foo":"bar"}\n{"foo":"baz"}',
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
    expect(await response.text()).toBe('{"foo":"bar"}\n{"foo":"baz"}')
  })

  it('GET /foobar -> keeps a plain text string body raw', async () => {
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
                  'text/plain': {
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
    expect(await response.text()).toBe('foobar')
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

  it('returns a structured JSON 500 naming the operation that failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const server = await createMockServer({
      document: documentWithOnePet('getPet'),
      onRequest: () => {
        throw new Error('Boom')
      },
    })

    const response = await server.request('/pets/1')

    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(await response.json()).toStrictEqual({
      error: 'Internal Server Error',
      message: 'Boom',
      operation: {
        method: 'GET',
        path: '/pets/{petId}',
        operationId: 'getPet',
      },
    })
  })

  it('omits the operationId when the operation does not declare one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const server = await createMockServer({
      document: documentWithOnePet(),
      onRequest: () => {
        throw new Error('Boom')
      },
    })

    const response = await server.request('/pets/1')

    expect(response.status).toBe(500)
    expect(await response.json()).toStrictEqual({
      error: 'Internal Server Error',
      message: 'Boom',
      operation: {
        method: 'GET',
        path: '/pets/{petId}',
      },
    })
  })

  it('logs the operation alongside the error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const server = await createMockServer({
      document: documentWithOnePet('getPet'),
      onRequest: () => {
        throw new Error('Boom')
      },
    })

    await server.request('/pets/1')

    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('Error while mocking GET /pets/{petId}:')
    expect(consoleErrorSpy.mock.calls[0]?.[1]).toStrictEqual(new Error('Boom'))
  })

  it('names the operation when building the mock response fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const server = await createMockServer({ document: documentWithBrokenResponseHeader })

    const response = await server.request('/pets/1')
    // The runtime words this failure, so it is the one field matched loosely, on the header name.
    const { message, ...body } = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body).toStrictEqual({
      error: 'Internal Server Error',
      operation: {
        method: 'GET',
        path: '/pets/{petId}',
        operationId: 'getPet',
      },
    })
    expect(message).toContain('X Invalid Name')
  })

  it('omits the operation when the failing route is not a mocked operation', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const server = await createMockServer({
      document: {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      },
    })

    // Routes added to the returned app mock no operation, so there is nothing to name.
    server.get('/custom', () => {
      throw new Error('Boom')
    })

    const response = await server.request('/custom')

    expect(response.status).toBe(500)
    expect(await response.json()).toStrictEqual({
      error: 'Internal Server Error',
      message: 'Boom',
    })
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('Error handling GET /custom:')
  })

  it('keeps the status and body of an error that carries its own response', async () => {
    const server = await createMockServer({
      document: documentWithOnePet(),
      onRequest: () => {
        throw new HTTPException(418, { message: 'I am a teapot' })
      },
    })

    const response = await server.request('/pets/1')

    expect(response.status).toBe(418)
    expect(await response.text()).toBe('I am a teapot')
  })

  describe('path keys with a query string', () => {
    /** Build a document with a plain path key and a variant that pins `beta=true`. */
    const documentWithBetaVariant = (paths: string[]) => ({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: Object.fromEntries(
        paths.map((path) => [
          path,
          {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { example: { path } } },
                },
              },
            },
          },
        ]),
      ),
    })

    it('routes the variant and the plain sibling independently', async () => {
      const server = await createMockServer({
        document: documentWithBetaVariant(['/v1/messages?beta=true', '/v1/messages']),
      })

      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({
        path: '/v1/messages?beta=true',
      })
      expect(await (await server.request('/v1/messages')).json()).toStrictEqual({ path: '/v1/messages' })
    })

    it('routes the variant even when the plain sibling comes first in the document', async () => {
      const server = await createMockServer({
        document: documentWithBetaVariant(['/v1/messages', '/v1/messages?beta=true']),
      })

      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({
        path: '/v1/messages?beta=true',
      })
    })

    it('ignores a request that does not carry the pinned value', async () => {
      const server = await createMockServer({ document: documentWithBetaVariant(['/v1/messages?beta=true']) })

      expect((await server.request('/v1/messages?beta=false')).status).toBe(404)
      expect((await server.request('/v1/messages')).status).toBe(404)
      expect((await server.request('/v1/messages?beta=true')).status).toBe(200)
    })

    it('keeps the path parameters of a variant', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/models/{model_id}?beta=true': {
            get: {
              parameters: [{ name: 'model_id', in: 'path', required: true, schema: { type: 'string' } }],
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { example: { beta: true } } },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      expect((await server.request('/v1/models/claude?beta=true')).status).toBe(200)
    })

    it('leaves a literal path ahead of a parameterized one that pins a query', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        paths: {
          '/v1/messages': {
            get: {
              responses: {
                '200': { description: 'OK', content: { 'application/json': { example: { via: 'literal' } } } },
              },
            },
          },
          '/v1/{anything}?beta=true': {
            get: {
              responses: {
                '200': { description: 'OK', content: { 'application/json': { example: { via: 'catch-all' } } } },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      expect(await (await server.request('/v1/messages?beta=true')).json()).toStrictEqual({ via: 'literal' })
    })

    it('still runs authentication and validation for a variant', async () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Hello World', version: '1.0.0' },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer' },
          },
        },
        paths: {
          '/v1/messages?beta=true': {
            get: {
              security: [{ bearerAuth: [] }],
              parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'integer' } }],
              responses: {
                '200': {
                  description: 'OK',
                  content: { 'application/json': { example: { beta: true } } },
                },
              },
            },
          },
        },
      }

      const server = await createMockServer({ document })

      expect((await server.request('/v1/messages?beta=true&limit=1')).status).toBe(401)

      const headers = { Authorization: 'Bearer super-secret-token' }

      expect((await server.request('/v1/messages?beta=true', { headers })).status).toBe(422)
      expect((await server.request('/v1/messages?beta=true&limit=1', { headers })).status).toBe(200)
    })

    it('answers requests for a document whose parameterized path keys carry a query string', async () => {
      // Path keys like these used to make Hono compile an invalid regular expression, so every
      // single request failed with an empty `500`.
      const server = await createMockServer({
        document: documentWithBetaVariant(['/a/{x}/b?q=1', '/a/{x}/b/{y}?q=1']),
      })

      expect((await server.request('/a/1/b?q=1')).status).toBe(200)
      expect((await server.request('/a/1/b/2?q=1')).status).toBe(200)
    })
  })
})
