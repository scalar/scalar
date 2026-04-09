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
})
