import type { ClientPlugin } from '@scalar/api-client/v2/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { describe, expect, it, vi } from 'vitest'

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

    const config = {
      onBeforeRequest: onBeforeRequestMock as any,
    } as ApiReferenceConfigurationRaw

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

    const config = {
      onBeforeRequest: onBeforeRequestMock as any,
    } as ApiReferenceConfigurationRaw

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

    const config = {
      onRequestSent: onRequestSentMock as any,
    } as ApiReferenceConfigurationRaw

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

  /**
   * Test 4: Type-safe handling of empty config
   * Critical because this ensures the function handles edge cases gracefully
   * and returns an empty array when no callbacks are provided
   */
  it('returns an empty array when config has no callback functions', () => {
    // Arrange: Create configs with no callbacks
    const emptyConfig: Partial<ApiReferenceConfigurationRaw> = {}

    const configWithOtherProps: Partial<ApiReferenceConfigurationRaw> = {
      theme: 'default' as any,
      layout: 'classic' as any,
      showSidebar: true,
    }

    // Act: Map the configs to plugins
    const pluginsFromEmpty: ClientPlugin[] = mapConfigPlugins(emptyConfig as ApiReferenceConfigurationRaw)
    const pluginsFromOther: ClientPlugin[] = mapConfigPlugins(configWithOtherProps as ApiReferenceConfigurationRaw)

    // Assert: Verify empty arrays are returned
    expect(pluginsFromEmpty).toEqual([])
    expect(pluginsFromEmpty).toHaveLength(0)
    expect(Array.isArray(pluginsFromEmpty)).toBe(true)

    expect(pluginsFromOther).toEqual([])
    expect(pluginsFromOther).toHaveLength(0)
    expect(Array.isArray(pluginsFromOther)).toBe(true)

    // Type-safe assertion: result is always an array of ClientPlugin
    const _typeCheck: ClientPlugin[] = pluginsFromEmpty
    expect(_typeCheck).toBeDefined()
  })
})
