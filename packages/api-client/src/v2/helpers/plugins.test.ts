import { describe, expect, it } from 'vitest'

import type { ClientPlugin } from './plugins'
import { executeHook } from './plugins'

describe('executeHook', () => {
  it('returns the original payload when no plugins are provided', async () => {
    const request = new Request('https://example.com')
    const result = await executeHook({ request }, 'beforeRequest', [])

    expect(result).toEqual({ request })
  })

  it('executes a single plugin hook and returns modified payload', async () => {
    const request = new Request('https://example.com')
    const plugin: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers: { 'X-Custom-Header': 'test-value' },
          })
          return { request: modifiedRequest }
        },
      },
    }

    const result = await executeHook({ request }, 'beforeRequest', [plugin])

    expect(result.request.headers.get('X-Custom-Header')).toBe('test-value')
  })

  it('chains multiple plugins in order and applies all modifications', async () => {
    const request = new Request('https://example.com')

    const plugin1: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers: { 'X-Plugin-1': 'first' },
          })
          return { request: modifiedRequest }
        },
      },
    }

    const plugin2: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          const headers = new Headers(req.request.headers)
          headers.set('X-Plugin-2', 'second')
          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers,
          })
          return { request: modifiedRequest }
        },
      },
    }

    const plugin3: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          const headers = new Headers(req.request.headers)
          headers.set('X-Plugin-3', 'third')
          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers,
          })
          return { request: modifiedRequest }
        },
      },
    }

    const result = await executeHook({ request }, 'beforeRequest', [plugin1, plugin2, plugin3])

    expect(result.request.headers.get('X-Plugin-1')).toBe('first')
    expect(result.request.headers.get('X-Plugin-2')).toBe('second')
    expect(result.request.headers.get('X-Plugin-3')).toBe('third')
  })

  it('skips plugins without the specified hook', async () => {
    const request = new Request('https://example.com')

    const pluginWithoutHook: ClientPlugin = {
      hooks: {
        responseReceived: async () => {
          // This hook will not be called
        },
      },
    }

    const pluginWithHook: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers: { 'X-Applied': 'true' },
          })
          return { request: modifiedRequest }
        },
      },
    }

    const result = await executeHook({ request }, 'beforeRequest', [pluginWithoutHook, pluginWithHook])

    expect(result.request.headers.get('X-Applied')).toBe('true')
  })

  it('handles async hooks and waits for promises to resolve', async () => {
    const request = new Request('https://example.com')

    const asyncPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: async (req) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))

          const modifiedRequest = new Request(req.request.url, {
            ...req.request,
            headers: { 'X-Async': 'completed' },
          })
          return { request: modifiedRequest }
        },
      },
    }

    const result = await executeHook({ request }, 'beforeRequest', [asyncPlugin])

    expect(result.request.headers.get('X-Async')).toBe('completed')
  })

  it('maintains type safety with HookPayloadMap for different hook types', async () => {
    // Test beforeRequest hook with Request payload
    const request = new Request('https://example.com')
    const beforeRequestPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: (req) => {
          // Type should be inferred as Request
          expect(req.request).toBeInstanceOf(Request)
          return req
        },
      },
    }

    const requestResult = await executeHook({ request }, 'beforeRequest', [beforeRequestPlugin])
    expect(requestResult.request).toBeInstanceOf(Request)

    // Test responseReceived hook with different payload structure
    const response = new Response('{}', { status: 200 })
    const operation = { operationId: 'testOp', method: 'GET' }
    const responsePayload = { response, operation, request }

    const responsePlugin: ClientPlugin = {
      hooks: {
        responseReceived: (payload) => {
          // Type should be inferred as { response: Response; operation: Record<string, any> }
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
