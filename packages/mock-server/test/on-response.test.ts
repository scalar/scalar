import { describe, expect, it, vi } from 'vitest'

import { createMockServer } from '../src/create-mock-server'
import type { MockServerResponseHook } from '../src/types'

/** A small document with a paginated list, a streaming route, and a query-pinned variant. */
const document = {
  openapi: '3.1.0',
  info: { title: 'Hello World', version: '1.0.0' },
  paths: {
    '/items': {
      get: {
        operationId: 'listItems',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'A page of items',
            headers: { 'X-Rate-Limit': { schema: { type: 'integer' }, example: 100 } },
            content: {
              'application/json': {
                example: { data: [{ id: 1 }], has_more: true, next_cursor: 'string' },
              },
            },
          },
        },
      },
    },
    '/events': {
      get: {
        operationId: 'streamEvents',
        responses: {
          '200': {
            description: 'Events',
            content: { 'text/event-stream': { example: [{ data: 'one' }, { data: 'two' }] } },
          },
        },
      },
    },
    '/v1/messages?beta=true': {
      get: {
        operationId: 'listMessagesBeta',
        responses: { '200': { description: 'OK', content: { 'application/json': { example: { beta: true } } } } },
      },
    },
    '/v1/messages': {
      get: {
        operationId: 'listMessages',
        responses: { '200': { description: 'OK', content: { 'application/json': { example: { beta: false } } } } },
      },
    },
  },
}

describe('on-response', () => {
  it('passes the context, operation and response to an observe-only hook and keeps the response', async () => {
    const onResponse = vi.fn<MockServerResponseHook>()
    const server = await createMockServer({ document, logger: false, onResponse })

    const response = await server.request('/items')

    expect(onResponse).toHaveBeenCalledOnce()
    const [{ context, operation, response: seen }] = onResponse.mock.lastCall!
    expect(context.req.method).toBe('GET')
    expect(context.req.path).toBe('/items')
    expect(operation?.operationId).toBe('listItems')
    // Nothing was rebuilt or buffered: the client receives the very response the hook saw.
    expect(response).toBe(seen)
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(await response.json()).toStrictEqual({ data: [{ id: 1 }], has_more: true, next_cursor: 'string' })
  })

  it('replaces the body, keeping the CORS headers and dropping the mock response headers', async () => {
    const server = await createMockServer({
      document,
      logger: false,
      onResponse: async ({ operation, response }) => {
        if (operation?.operationId !== 'listItems') {
          return
        }

        const body = await response.json()
        return Response.json({ ...body, has_more: false, next_cursor: null }, { headers: { 'X-Page': 'last' } })
      },
    })

    const response = await server.request('/items')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ data: [{ id: 1 }], has_more: false, next_cursor: null })
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('X-Page')).toBe('last')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('X-Rate-Limit')).toBeNull()
  })

  it('lets the replacement set its own value for a header the mock response also sets', async () => {
    const server = await createMockServer({
      document,
      logger: false,
      onResponse: ({ response }) => {
        const headers = new Headers(response.headers)
        headers.set('X-Rate-Limit', '0')
        return new Response(response.body, { status: response.status, headers })
      },
    })
    const withoutHook = await createMockServer({ document, logger: false })

    const response = await server.request('/items')

    // Make sure the mock sends a different value, so the assertion below shows which one won.
    expect((await withoutHook.request('/items')).headers.get('X-Rate-Limit')).not.toBe('0')
    expect(response.headers.get('X-Rate-Limit')).toBe('0')
    expect(await response.json()).toMatchObject({ has_more: true })
  })

  it('replaces the status', async () => {
    const server = await createMockServer({
      document,
      logger: false,
      onResponse: () => new Response(null, { status: 503, statusText: 'Service Unavailable' }),
    })

    const response = await server.request('/items')

    expect(response.status).toBe(503)
    expect(response.statusText).toBe('Service Unavailable')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(await response.text()).toBe('')
  })

  it('leaves a streaming response untouched when the hook only observes it', async () => {
    const observed: { bodyUsed: boolean; contentType: string | null }[] = []
    const server = await createMockServer({
      document,
      logger: false,
      onResponse: ({ response }) => {
        observed.push({ bodyUsed: response.bodyUsed, contentType: response.headers.get('Content-Type') })
      },
    })
    const withoutHook = await createMockServer({ document, logger: false })

    const response = await server.request('/events')

    expect(observed).toStrictEqual([{ bodyUsed: false, contentType: 'text/event-stream' }])
    expect(response.bodyUsed).toBe(false)
    expect(response.body).toBeInstanceOf(ReadableStream)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(await response.text()).toBe(await (await withoutHook.request('/events')).text())
  })

  it('receives the operation of a query-pinned variant', async () => {
    const onResponse = vi.fn<MockServerResponseHook>()
    const server = await createMockServer({ document, logger: false, onResponse })

    await server.request('/v1/messages?beta=true')
    await server.request('/v1/messages')

    expect(onResponse).toHaveBeenCalledTimes(2)
    expect(onResponse.mock.calls.map(([{ operation }]) => operation?.operationId)).toStrictEqual([
      'listMessagesBeta',
      'listMessages',
    ])
  })

  it('waits for an async hook', async () => {
    const server = await createMockServer({
      document,
      logger: false,
      onResponse: async ({ response }) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return new Response(`status was ${response.status}`, { status: 202 })
      },
    })

    const response = await server.request('/items')

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('status was 200')
  })

  it('passes no operation for routes that are not operations', async () => {
    const onResponse = vi.fn<MockServerResponseHook>()
    const server = await createMockServer({ document, logger: false, onResponse })
    server.get('/custom', (c) => c.text('custom'))

    const exported = await server.request('/openapi.json')
    const custom = await server.request('/custom')
    const missing = await server.request('/does-not-exist')

    expect(exported.status).toBe(200)
    expect(custom.status).toBe(200)
    expect(missing.status).toBe(404)
    expect(onResponse.mock.calls.map(([{ operation, response }]) => [operation, response.status])).toStrictEqual([
      [undefined, 200],
      [undefined, 200],
      [undefined, 404],
    ])
  })

  it('receives request validation failures', async () => {
    const onResponse = vi.fn<MockServerResponseHook>()
    const server = await createMockServer({ document, logger: false, onResponse })

    const response = await server.request('/items?limit=not-a-number')

    expect(response.status).toBe(422)
    expect(onResponse).toHaveBeenCalledOnce()
    const [{ operation, response: seen }] = onResponse.mock.lastCall!
    expect(operation?.operationId).toBe('listItems')
    expect(seen.status).toBe(422)
  })

  it('runs for HEAD requests without sending a body', async () => {
    const onResponse = vi.fn<MockServerResponseHook>(() => new Response('replaced', { status: 200 }))
    const server = await createMockServer({ document, logger: false, onResponse })

    const response = await server.request('/items', { method: 'HEAD' })

    expect(onResponse).toHaveBeenCalledOnce()
    expect(onResponse.mock.lastCall?.[0].operation?.operationId).toBe('listItems')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
  })

  it('does not run for CORS preflight requests', async () => {
    const onResponse = vi.fn<MockServerResponseHook>()
    const server = await createMockServer({ document, logger: false, onResponse })

    const response = await server.request('/items', {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'GET' },
    })

    expect(response.status).toBe(204)
    expect(onResponse).not.toHaveBeenCalled()
  })

  it('answers with a 500 naming the operation when the hook throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const onResponse = vi.fn<MockServerResponseHook>(() => {
        throw new Error('hook failed')
      })
      const server = await createMockServer({ document, logger: false, onResponse })

      const response = await server.request('/items')

      expect(response.status).toBe(500)
      expect(await response.json()).toStrictEqual({
        error: 'Internal Server Error',
        message: 'hook failed',
        operation: { method: 'GET', path: '/items', operationId: 'listItems' },
      })
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('X-Rate-Limit')).toBeNull()
      // The error response is not handed to the hook again.
      expect(onResponse).toHaveBeenCalledOnce()
      expect(error).toHaveBeenCalledOnce()
    } finally {
      error.mockRestore()
    }
  })

  it('answers with a 500 when an async hook rejects', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const server = await createMockServer({
        document,
        logger: false,
        onResponse: async () => {
          await Promise.resolve()
          throw new Error('async hook failed')
        },
      })

      const response = await server.request('/events')

      expect(response.status).toBe(500)
      expect(await response.json()).toMatchObject({
        message: 'async hook failed',
        operation: { operationId: 'streamEvents' },
      })
    } finally {
      error.mockRestore()
    }
  })

  it('receives the error handler response when mocking fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const onResponse = vi.fn<MockServerResponseHook>()
      const server = await createMockServer({
        logger: false,
        onResponse,
        document: {
          openapi: '3.1.0',
          info: { title: 'Broken', version: '1.0.0' },
          paths: {
            '/broken': {
              get: {
                responses: {
                  '200': {
                    description: 'OK',
                    headers: { 'X Invalid Name': { schema: { type: 'string' }, example: 'value' } },
                    content: { 'application/json': { example: {} } },
                  },
                },
              },
            },
          },
        },
      })

      const response = await server.request('/broken')

      expect(response.status).toBe(500)
      expect(onResponse).toHaveBeenCalledOnce()
      expect(onResponse.mock.lastCall?.[0].response.status).toBe(500)
    } finally {
      error.mockRestore()
    }
  })
})
