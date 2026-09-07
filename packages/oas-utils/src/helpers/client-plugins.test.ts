import type { RequestFactory } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'

import type { ClientPlugin } from './client-plugins'
import { executeHook } from './client-plugins'

const createFactory = (headers?: Record<string, string>): RequestFactory => ({
  options: {},
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '' },
  method: 'GET',
  proxyUrl: '',
  query: new URLSearchParams(),
  headers: new Headers(headers ?? {}),
  body: null,
  cookies: [],
  cache: 'default',
  security: [],
})

const beforePayload = (requestBuilder: RequestFactory) => ({
  requestBuilder,
  document: {} as never,
  operation: {} as never,
})

describe('executeHook', () => {
  it('returns the original payload when no plugins are provided', async () => {
    const requestBuilder = createFactory()
    const document = {} as never
    const operation = {} as never
    const result = await executeHook({ requestBuilder, document, operation }, 'beforeRequest', [])

    expect(result.requestBuilder).toBe(requestBuilder)
    expect(result.document).toBe(document)
    expect(result.operation).toBe(operation)
  })

  it('executes a single plugin hook and returns modified payload', async () => {
    const requestBuilder = createFactory()
    const plugin: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.requestBuilder.headers.set('X-Custom-Header', 'test-value')
        },
      },
    }

    const result = await executeHook(beforePayload(requestBuilder), 'beforeRequest', [plugin])

    expect(result.requestBuilder.headers.get('X-Custom-Header')).toBe('test-value')
  })

  it('forwards server and customFetch to the beforeRequest hook', async () => {
    const requestBuilder = createFactory()
    const server = { url: 'https://api.example.com' } as never
    const customFetch = fetch
    let received: { server?: unknown; customFetch?: unknown } = {}
    const plugin: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          received = { server: payload.server, customFetch: payload.customFetch }
        },
      },
    }

    await executeHook({ ...beforePayload(requestBuilder), server, customFetch }, 'beforeRequest', [plugin])

    expect(received.server).toBe(server)
    expect(received.customFetch).toBe(customFetch)
  })

  it('chains multiple plugins in order and applies all modifications', async () => {
    const requestBuilder = createFactory()

    const plugin1: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.requestBuilder.headers.set('X-Plugin-1', 'first')
        },
      },
    }

    const plugin2: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.requestBuilder.headers.set('X-Plugin-2', 'second')
        },
      },
    }

    const plugin3: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.requestBuilder.headers.set('X-Plugin-3', 'third')
        },
      },
    }

    const result = await executeHook(beforePayload(requestBuilder), 'beforeRequest', [plugin1, plugin2, plugin3])

    expect(result.requestBuilder.headers.get('X-Plugin-1')).toBe('first')
    expect(result.requestBuilder.headers.get('X-Plugin-2')).toBe('second')
    expect(result.requestBuilder.headers.get('X-Plugin-3')).toBe('third')
  })

  it('skips plugins without the specified hook', async () => {
    const requestBuilder = createFactory()

    const pluginWithoutHook: ClientPlugin = {
      hooks: {
        responseReceived: async () => {
          // This hook will not be called
        },
      },
    }

    const pluginWithHook: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.requestBuilder.headers.set('X-Applied', 'true')
        },
      },
    }

    const result = await executeHook(beforePayload(requestBuilder), 'beforeRequest', [
      pluginWithoutHook,
      pluginWithHook,
    ])

    expect(result.requestBuilder.headers.get('X-Applied')).toBe('true')
  })

  it('handles async hooks and waits for promises to resolve', async () => {
    const requestBuilder = createFactory()

    const asyncPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 10))

          payload.requestBuilder.headers.set('X-Async', 'completed')
        },
      },
    }

    const result = await executeHook(beforePayload(requestBuilder), 'beforeRequest', [asyncPlugin])

    expect(result.requestBuilder.headers.get('X-Async')).toBe('completed')
  })

  it('executes requestBuilt hooks with the exact request instance so mutations apply', async () => {
    const requestBuilder = createFactory()
    const request = new Request('https://example.com/api/test', { method: 'GET' })

    const plugin: ClientPlugin = {
      hooks: {
        requestBuilt: async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 10))

          payload.request.headers.set('X-Signature', 'abc123')
        },
      },
    }

    const result = await executeHook(
      { request, requestBuilder, document: {} as never, operation: {} as never },
      'requestBuilt',
      [plugin],
    )

    expect(result.request).toBe(request)
    expect(request.headers.get('X-Signature')).toBe('abc123')
  })

  it('maintains type safety with HookPayloadMap for different hook types', async () => {
    const requestBuilder = createFactory()
    const beforeRequestPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          expect(req.requestBuilder.method).toBe('GET')
        },
      },
    }

    const requestResult = await executeHook(beforePayload(requestBuilder), 'beforeRequest', [beforeRequestPlugin])
    expect(requestResult.requestBuilder.method).toBe('GET')

    const response = new Response('{}', { status: 200 })
    const operation = { operationId: 'testOp', method: 'GET' }
    const sentRequest = new Request('https://example.com')
    const responsePayload = {
      response,
      operation,
      requestBuilder,
      request: sentRequest,
      document: {} as never,
    }

    const responsePlugin: ClientPlugin = {
      hooks: {
        responseReceived: (payload) => {
          expect(payload.response).toBeInstanceOf(Response)
          expect(payload.operation).toEqual(operation)
          expect(payload.request).toBe(sentRequest)
        },
      },
    }

    const responseResult = await executeHook(responsePayload, 'responseReceived', [responsePlugin])

    expect(responseResult.response).toBeInstanceOf(Response)
    expect(responseResult.operation).toEqual(operation)
  })
  it('keeps the response readable when multiple hooks consume their clones', async () => {
    const response = Response.json({ token: 'secret' })
    const values: unknown[] = []
    const plugin: ClientPlugin = {
      hooks: {
        responseReceived: async ({ response }) => {
          values.push(await response.json())
        },
      },
    }
    const result = await executeHook(
      { ...beforePayload(createFactory()), request: new Request('https://example.com'), response },
      'responseReceived',
      [plugin, {}, plugin],
    )

    expect(values).toStrictEqual([{ token: 'secret' }, { token: 'secret' }])
    expect(result.response).toBe(response)
    expect(await result.response.json()).toStrictEqual({ token: 'secret' })
  })

  it('passes replacement responses to subsequent hooks in order', async () => {
    const first = Response.json({ count: 1 }, { status: 201 })
    const result = await executeHook(
      {
        ...beforePayload(createFactory()),
        request: new Request('https://example.com'),
        response: Response.json({ count: 0 }),
      },
      'responseReceived',
      [
        { hooks: { responseReceived: () => first } },
        {
          hooks: {
            responseReceived: async ({ response }) => {
              expect(response.status).toBe(201)
              const data = await response.json()
              return Response.json({ count: data.count + 1 }, { status: 202 })
            },
          },
        },
      ],
    )

    expect(result.response.status).toBe(202)
    expect(await result.response.json()).toStrictEqual({ count: 2 })
  })

  it('preserves streaming bodies when an observer precedes a stream replacement', async () => {
    const response = new Response('data: original\n\n', { headers: { 'content-type': 'text/event-stream' } })
    const result = await executeHook(
      { ...beforePayload(createFactory()), request: new Request('https://example.com'), response },
      'responseReceived',
      [
        {
          hooks: {
            responseReceived: ({ response }) => {
              expect(response.status).toBe(200)
            },
          },
        },
        {
          hooks: {
            responseReceived: ({ response }) =>
              new Response(response.body, {
                headers: { 'content-type': 'text/event-stream', 'x-intercepted': 'yes' },
              }),
          },
        },
      ],
    )

    expect(result.response.headers.get('x-intercepted')).toBe('yes')
    expect(await result.response.text()).toBe('data: original\n\n')
  })

  it.each(['forward', 'transform', 'partial read'] as const)(
    'cancels the source after a %s hook when the displayed stream is cancelled',
    async (mode) => {
      let cancelled = false
      const response = new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: original\n\n'))
          },
          cancel() {
            cancelled = true
          },
        }),
      )
      const result = await executeHook(
        { ...beforePayload(createFactory()), request: new Request('https://example.com'), response },
        'responseReceived',
        [
          {
            hooks: {
              responseReceived: async ({ response }) => {
                if (!response.body) {
                  throw new Error('Expected a response body')
                }
                if (mode === 'partial read') {
                  const reader = response.body.getReader()
                  await reader.read()
                  reader.releaseLock()
                  return
                }
                return new Response(
                  mode === 'transform'
                    ? response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>())
                    : response.body,
                )
              },
            },
          },
        ],
      )

      const reader = result.response.body!.getReader()
      expect(new TextDecoder().decode((await reader.read()).value)).toBe('data: original\n\n')
      await reader.cancel()
      await expect.poll(() => cancelled).toBe(true)
    },
  )

  it('cancels both discarded branches when replacing a stream with a separate response', async () => {
    let cancelled = false
    const response = new Response(
      new ReadableStream({
        cancel() {
          cancelled = true
        },
      }),
    )
    const result = await executeHook(
      { ...beforePayload(createFactory()), request: new Request('https://example.com'), response },
      'responseReceived',
      [{ hooks: { responseReceived: () => Response.json({ replaced: true }) } }],
    )

    expect(await result.response.json()).toStrictEqual({ replaced: true })
    await expect.poll(() => cancelled).toBe(true)
  })

  it('propagates response hook errors', async () => {
    await expect(
      executeHook(
        {
          ...beforePayload(createFactory()),
          request: new Request('https://example.com'),
          response: new Response('original'),
        },
        'responseReceived',
        [
          {
            hooks: {
              responseReceived: () => {
                throw new Error('interception failed')
              },
            },
          },
        ],
      ),
    ).rejects.toThrow('interception failed')
  })
})
