import type { ClientPlugin } from '@scalar/api-client/v2/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { assert, describe, expect, it, vi } from 'vitest'
import { type ComputedRef, type Ref, computed, nextTick, ref } from 'vue'

import { mapConfigPlugins } from './map-config-plugins'

describe('mapConfigPlugins', () => {
  /**
   * Test 1: Type-safe transformation of onBeforeRequest to beforeRequest hook
   * Critical because this ensures the request modification pipeline works correctly
   */
  it('transforms onBeforeRequest callback into a ClientPlugin with beforeRequest hook that returns modified request', async () => {
    // Arrange: Create a mock config with onBeforeRequest that modifies the request
    const mockRequest = new Request('https://example.com/api/test', {
      method: 'GET',
      headers: { 'X-Original': 'true' },
    })

    const modifiedRequest = new Request('https://example.com/api/modified', {
      method: 'POST',
      headers: { 'X-Modified': 'true' },
    })

    const onBeforeRequestMock = vi.fn(async () => ({
      request: modifiedRequest,
    }))

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    // Assert: Verify plugin structure and behavior
    expect(plugins).toHaveLength(1)
    expect(plugins[0]).toHaveProperty('hooks')
    expect(plugins[0]?.hooks).toHaveProperty('beforeRequest')

    // Type-safe assertion: beforeRequest hook exists and is callable
    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    expect(beforeRequestHook).toBeDefined()

    if (beforeRequestHook) {
      const result = await beforeRequestHook({ request: mockRequest })

      // Verify the original callback was called with correct payload
      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
      expect(onBeforeRequestMock).toHaveBeenCalledWith({ request: mockRequest })

      // Verify the modified request is returned
      expect(result).toEqual({ request: modifiedRequest })
      expect(result.request.url).toBe('https://example.com/api/modified')
      expect(result.request.method).toBe('POST')
    }
  })

  /**
   * Test 2: Type-safe handling of void return from onBeforeRequest
   * Critical because onBeforeRequest can return void, and we must handle this edge case
   * to prevent breaking the request pipeline
   */
  it('handles void return from onBeforeRequest by returning original payload', async () => {
    // Arrange: Create a mock config with onBeforeRequest that returns void
    const mockRequest = new Request('https://example.com/api/test', {
      method: 'GET',
      headers: { 'X-Test': 'true' },
    })

    const onBeforeRequestMock = vi.fn(async () => {
      // Simulate side-effect only callback (e.g., logging)
      await Promise.resolve()
      console.log('Request intercepted')
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    // Assert: Verify the hook returns the original payload when callback returns void
    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    expect(beforeRequestHook).toBeDefined()

    if (beforeRequestHook) {
      const result = await beforeRequestHook({ request: mockRequest })

      // Verify the original callback was called
      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)

      // Critical assertion: original payload is returned when callback returns void
      expect(result).toEqual({ request: mockRequest })
      expect(result.request).toBe(mockRequest)
      expect(result.request.url).toBe('https://example.com/api/test')
    }
  })

  /**
   * Test 3: Type-safe transformation of onRequestSent to responseReceived hook
   * Critical because this ensures the response handling pipeline works correctly
   * and that the payload transformation (full response object to URL string) is correct
   */
  it('transforms onRequestSent callback into a ClientPlugin with responseReceived hook that extracts request URL', async () => {
    // Arrange: Create a mock config with onRequestSent
    const mockRequest = new Request('https://example.com/api/endpoint', {
      method: 'POST',
    })

    const mockResponse = new Response('{"data": "test"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const onRequestSentMock = vi.fn()

    const config = computed(() => ({
      onRequestSent: onRequestSentMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    // Assert: Verify plugin structure and behavior
    expect(plugins).toHaveLength(1)
    expect(plugins[0]).toHaveProperty('hooks')
    expect(plugins[0]?.hooks).toHaveProperty('responseReceived')

    // Type-safe assertion: responseReceived hook exists and is callable
    const responseReceivedHook = plugins[0]?.hooks?.responseReceived
    expect(responseReceivedHook).toBeDefined()

    if (responseReceivedHook) {
      // Call the hook with the full payload structure
      await responseReceivedHook({
        response: mockResponse,
        request: mockRequest,
        operation: {
          operationId: 'test-operation',
          method: 'post',
          path: '/endpoint',
        } as any,
      })

      // Critical assertion: verify only the URL is passed to the original callback
      expect(onRequestSentMock).toHaveBeenCalledTimes(1)
      expect(onRequestSentMock).toHaveBeenCalledWith('https://example.com/api/endpoint')
    }
  })

  it('updates beforeRequest hook when onBeforeRequest callback changes in config', async () => {
    const fn = vi.fn()

    const firstCallback = (it: any) => {
      fn('first')
      return it
    }

    const secondCallback = (it: any) => {
      fn('second')
      return it
    }

    const config = ref({
      onBeforeRequest: firstCallback,
    }) as Ref<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    // Assert: Initial callback works
    const hooks = plugins[0]?.hooks
    assert(hooks)

    assert(hooks.beforeRequest)

    await hooks.beforeRequest({ request: new Request('https://example.com/api/test', { method: 'GET' }) })
    expect(fn).toHaveBeenCalledTimes(1)

    // Act: Change the config to use a different callback
    config.value.onBeforeRequest = secondCallback
    await nextTick()

    // Assert: New callback is now being used, old callback is not called again
    await hooks.beforeRequest({ request: new Request('https://example.com/api/test', { method: 'GET' }) })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('updates responseReceived hook when onRequestSent callback changes in config', async () => {
    const mockRequest = new Request('https://example.com/api/test', { method: 'GET' })
    const mockResponse = new Response('{"data": "test"}', { status: 200 })
    const mockOperation = { operationId: 'test-operation', method: 'get', path: '/test' } as any
    const fn = vi.fn()

    const firstCallback = (it: any) => {
      fn('first')
      return it
    }

    const secondCallback = (it: any) => {
      fn('second')
      return it
    }

    const config = ref({
      onRequestSent: firstCallback,
    }) as Ref<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    // Assert: Initial callback works
    const hooks = plugins[0]?.hooks
    assert(hooks)

    assert(hooks.responseReceived)

    await hooks.responseReceived({ response: mockResponse, request: mockRequest, operation: mockOperation })
    expect(fn).toHaveBeenCalledTimes(1)

    // Act: Change the config to use a different callback
    config.value.onRequestSent = secondCallback
    await nextTick()

    // Assert: New callback is now being used, old callback is not called again
    await hooks.responseReceived({ response: mockResponse, request: mockRequest, operation: mockOperation })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('adds hooks when callbacks are added to an initially empty config', async () => {
    const fn = vi.fn()

    const firstCallback = (it: any) => {
      fn('first')
      return it
    }

    const config = ref({}) as Ref<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    // Assert: Initial callback works
    const hooks = plugins[0]?.hooks
    assert(hooks)

    expect(hooks.beforeRequest).toBeUndefined()

    // Act: Change the config to use a different callback
    config.value.onBeforeRequest = firstCallback
    await nextTick()

    // Assert: New callback is now being used, old callback is not called again
    await hooks.beforeRequest?.({ request: new Request('https://example.com/api/test', { method: 'GET' }) })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
  })

  /**
   * Test 8: Reactivity - hooks continue to work when config changes from having callbacks to not having any
   * Critical because this ensures the watch mechanism gracefully handles callback removal
   * and that hooks do not become undefined
   */
  it('removes hooks when callbacks are removed from config', async () => {
    const fn = vi.fn()

    const firstCallback = (it: any) => {
      fn('first')
      return it
    }

    const config = ref({
      onBeforeRequest: firstCallback,
    }) as Ref<ApiReferenceConfigurationRaw>

    // Act: Map the config to plugins
    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    // Assert: Initial callback works
    const hooks = plugins[0]?.hooks
    assert(hooks)

    assert(hooks.beforeRequest)

    await hooks.beforeRequest?.({ request: new Request('https://example.com/api/test', { method: 'GET' }) })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')

    // Act: Change the config to use a different callback
    config.value.onBeforeRequest = undefined
    await nextTick()

    expect(hooks.beforeRequest).toBeUndefined()
  })
})
