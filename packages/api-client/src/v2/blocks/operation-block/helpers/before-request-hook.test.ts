import { describe, expect, it, vi } from 'vitest'

import type { ClientPlugin } from '@/v2/plugins'

import { applyBeforeRequestHooks } from './before-request-hook'

describe('applyBeforeRequestHooks', () => {
  /**
   * Test 1: Verify that the function returns the original request when no plugins are provided.
   * This ensures the function handles empty plugin arrays gracefully.
   */
  it('should return the original request when no plugins are provided', async () => {
    const originalRequest = new Request('https://api.example.com/users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const result = await applyBeforeRequestHooks(originalRequest, [])

    expect(result).toBe(originalRequest)
    expect(result.url).toBe('https://api.example.com/users')
    expect(result.method).toBe('GET')
  })

  /**
   * Test 2: Verify that plugins are applied sequentially in a pipeline fashion.
   * Each plugin should receive the modified request from the previous plugin,
   * allowing for chained transformations.
   */
  it('should apply multiple plugins sequentially in pipeline order', async () => {
    const originalRequest = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const plugin1: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Plugin-1': 'applied' },
          })
          return newRequest
        }),
      },
    }

    const plugin2: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Plugin-2': 'applied' },
          })
          return newRequest
        }),
      },
    }

    const plugin3: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Plugin-3': 'applied' },
          })
          return newRequest
        }),
      },
    }

    const result = await applyBeforeRequestHooks(originalRequest, [plugin1, plugin2, plugin3])

    // Verify all plugins were called
    expect(plugin1.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(plugin2.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(plugin3.hooks?.beforeRequest).toHaveBeenCalledTimes(1)

    // Verify the final request has all headers from all plugins
    expect(result.headers.get('X-Plugin-1')).toBe('applied')
    expect(result.headers.get('X-Plugin-2')).toBe('applied')
    expect(result.headers.get('X-Plugin-3')).toBe('applied')

    // Verify plugin2 received the modified request from plugin1
    const plugin2CallArg = (plugin2.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(plugin2CallArg.headers.get('X-Plugin-1')).toBe('applied')

    // Verify plugin3 received the modified request from plugin2
    const plugin3CallArg = (plugin3.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(plugin3CallArg.headers.get('X-Plugin-1')).toBe('applied')
    expect(plugin3CallArg.headers.get('X-Plugin-2')).toBe('applied')
  })

  /**
   * Test 3: Verify that when a plugin returns null or undefined,
   * the current request is preserved and passed to the next plugin.
   * This prevents the pipeline from breaking due to plugins that do not return a value.
   */
  it('should preserve current request when a plugin returns null or undefined', async () => {
    const originalRequest = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const plugin1: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Modified': 'true' },
          })
          return newRequest
        }),
      },
    }

    // Plugin that returns undefined (simulating a plugin that does not modify the request)
    const plugin2: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn(() => {
          return undefined as any
        }),
      },
    }

    // Plugin that returns null explicitly
    const plugin3: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn(() => {
          return null as any
        }),
      },
    }

    const plugin4: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Final': 'applied' },
          })
          return newRequest
        }),
      },
    }

    const result = await applyBeforeRequestHooks(originalRequest, [plugin1, plugin2, plugin3, plugin4])

    // Verify all plugins were called
    expect(plugin1.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(plugin2.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(plugin3.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(plugin4.hooks?.beforeRequest).toHaveBeenCalledTimes(1)

    // Verify the modifications from plugin1 and plugin4 are preserved
    expect(result.headers.get('X-Modified')).toBe('true')
    expect(result.headers.get('X-Final')).toBe('applied')

    // Verify plugin4 received the request modified by plugin1 (not reset by plugin2/plugin3)
    const plugin4CallArg = (plugin4.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(plugin4CallArg.headers.get('X-Modified')).toBe('true')
  })

  /**
   * Test 4: Verify that async plugins are properly awaited and executed in order.
   * This ensures the function correctly handles promises and maintains sequential execution.
   */
  it('should properly await async plugins and maintain execution order', async () => {
    const executionOrder: number[] = []
    const originalRequest = new Request('https://api.example.com/data')

    const asyncPlugin1: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn(async (request: Request) => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          executionOrder.push(1)
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Async-1': 'completed' },
          })
          return newRequest
        }),
      },
    }

    const asyncPlugin2: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn(async (request: Request) => {
          await new Promise((resolve) => setTimeout(resolve, 30))
          executionOrder.push(2)
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Async-2': 'completed' },
          })
          return newRequest
        }),
      },
    }

    const asyncPlugin3: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn(async (request: Request) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          executionOrder.push(3)
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Async-3': 'completed' },
          })
          return newRequest
        }),
      },
    }

    const result = await applyBeforeRequestHooks(originalRequest, [asyncPlugin1, asyncPlugin2, asyncPlugin3])

    // Verify plugins executed in the correct order despite different delays
    expect(executionOrder).toEqual([1, 2, 3])

    // Verify all async modifications were applied
    expect(result.headers.get('X-Async-1')).toBe('completed')
    expect(result.headers.get('X-Async-2')).toBe('completed')
    expect(result.headers.get('X-Async-3')).toBe('completed')

    // Verify each async plugin received the result from the previous one
    const plugin2CallArg = (asyncPlugin2.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(plugin2CallArg.headers.get('X-Async-1')).toBe('completed')

    const plugin3CallArg = (asyncPlugin3.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(plugin3CallArg.headers.get('X-Async-1')).toBe('completed')
    expect(plugin3CallArg.headers.get('X-Async-2')).toBe('completed')
  })

  /**
   * Test 5: Verify that plugins without beforeRequest hooks are safely skipped.
   * This ensures the function handles incomplete plugin configurations gracefully
   * and does not break the pipeline when plugins do not implement all hooks.
   */
  it('should skip plugins without beforeRequest hooks and continue the pipeline', async () => {
    const originalRequest = new Request('https://api.example.com/test', {
      method: 'DELETE',
    })

    const pluginWithHook: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Has-Hook': 'true' },
          })
          return newRequest
        }),
      },
    }

    // Plugin with no hooks at all
    const pluginWithoutHooks: ClientPlugin = {}

    // Plugin with hooks object but no beforeRequest
    const pluginWithOtherHooks: ClientPlugin = {
      hooks: {
        responseReceived: vi.fn(),
      },
    }

    const anotherPluginWithHook: ClientPlugin = {
      hooks: {
        beforeRequest: vi.fn((request: Request) => {
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: { ...Object.fromEntries(request.headers), 'X-Another-Hook': 'true' },
          })
          return newRequest
        }),
      },
    }

    const result = await applyBeforeRequestHooks(originalRequest, [
      pluginWithHook,
      pluginWithoutHooks,
      pluginWithOtherHooks,
      anotherPluginWithHook,
    ])

    // Verify only plugins with beforeRequest hooks were called
    expect(pluginWithHook.hooks?.beforeRequest).toHaveBeenCalledTimes(1)
    expect(anotherPluginWithHook.hooks?.beforeRequest).toHaveBeenCalledTimes(1)

    // Verify the pipeline was not broken and both hooks were applied
    expect(result.headers.get('X-Has-Hook')).toBe('true')
    expect(result.headers.get('X-Another-Hook')).toBe('true')

    // Verify the second plugin with hook received the modified request from the first
    const secondPluginCallArg = (anotherPluginWithHook.hooks?.beforeRequest as any).mock.calls[0][0]
    expect(secondPluginCallArg.headers.get('X-Has-Hook')).toBe('true')
  })
})
