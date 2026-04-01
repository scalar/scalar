import type { RequestFactory } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'

import type { ClientPlugin } from './client-plugins'
import { executeHook } from './client-plugins'

const createFactory = (headers?: Record<string, string>): RequestFactory => ({
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '' },
  method: 'GET',
  proxy: { proxyUrl: '' },
  query: { params: new URLSearchParams() },
  headers: new Headers(headers ?? {}),
  body: null,
  cookies: { list: [] },
  cache: 'default',
  security: [],
})

const envVariables = {}

describe('executeHook', () => {
  it('returns the original payload when no plugins are provided', async () => {
    const request = createFactory()
    const document = {} as never
    const operation = {} as never
    const result = await executeHook({ request, document, operation, envVariables }, 'beforeRequest', [])

    expect(result.request).toBe(request)
    expect(result.document).toBe(document)
    expect(result.operation).toBe(operation)
    expect(result.envVariables).toBe(envVariables)
  })

  it('executes a single plugin hook and returns modified payload', async () => {
    const request = createFactory()
    const plugin: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.request.headers.set('X-Custom-Header', 'test-value')
          return { request: payload.request }
        },
      },
    }

    const result = await executeHook(
      { request, document: {} as never, operation: {} as never, envVariables },
      'beforeRequest',
      [plugin],
    )

    expect(result.request.headers.get('X-Custom-Header')).toBe('test-value')
  })

  it('chains multiple plugins in order and applies all modifications', async () => {
    const request = createFactory()

    const plugin1: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.request.headers.set('X-Plugin-1', 'first')
          return { request: payload.request }
        },
      },
    }

    const plugin2: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.request.headers.set('X-Plugin-2', 'second')
          return { request: payload.request }
        },
      },
    }

    const plugin3: ClientPlugin = {
      hooks: {
        beforeRequest: (payload) => {
          payload.request.headers.set('X-Plugin-3', 'third')
          return { request: payload.request }
        },
      },
    }

    const result = await executeHook(
      { request, document: {} as never, operation: {} as never, envVariables },
      'beforeRequest',
      [plugin1, plugin2, plugin3],
    )

    expect(result.request.headers.get('X-Plugin-1')).toBe('first')
    expect(result.request.headers.get('X-Plugin-2')).toBe('second')
    expect(result.request.headers.get('X-Plugin-3')).toBe('third')
  })

  it('skips plugins without the specified hook', async () => {
    const request = createFactory()

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
          payload.request.headers.set('X-Applied', 'true')
          return { request: payload.request }
        },
      },
    }

    const result = await executeHook(
      { request, document: {} as never, operation: {} as never, envVariables },
      'beforeRequest',
      [pluginWithoutHook, pluginWithHook],
    )

    expect(result.request.headers.get('X-Applied')).toBe('true')
  })

  it('handles async hooks and waits for promises to resolve', async () => {
    const request = createFactory()

    const asyncPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 10))

          payload.request.headers.set('X-Async', 'completed')
          return { request: payload.request }
        },
      },
    }

    const result = await executeHook(
      { request, document: {} as never, operation: {} as never, envVariables },
      'beforeRequest',
      [asyncPlugin],
    )

    expect(result.request.headers.get('X-Async')).toBe('completed')
  })

  it('maintains type safety with HookPayloadMap for different hook types', async () => {
    const request = createFactory()
    const beforeRequestPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          expect(req.request.method).toBe('GET')
          return req
        },
      },
    }

    const requestResult = await executeHook(
      { request, document: {} as never, operation: {} as never, envVariables },
      'beforeRequest',
      [beforeRequestPlugin],
    )
    expect(requestResult.request.method).toBe('GET')

    const response = new Response('{}', { status: 200 })
    const operation = { operationId: 'testOp', method: 'GET' }
    const responsePayload = {
      response,
      operation,
      request,
      requestUrl: 'https://example.com',
      document: {} as never,
      envVariables,
    }

    const responsePlugin: ClientPlugin = {
      hooks: {
        responseReceived: (payload) => {
          expect(payload.response).toBeInstanceOf(Response)
          expect(payload.operation).toEqual(operation)
        },
      },
    }

    const responseResult = await executeHook(responsePayload, 'responseReceived', [responsePlugin])

    expect(responseResult.response).toBeInstanceOf(Response)
    expect(responseResult.operation).toEqual(operation)
  })
})
