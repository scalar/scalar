import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { RequestFactory } from '@scalar/workspace-store/request-example'
import { assert, describe, expect, it, vi } from 'vitest'
import { type ComputedRef, type Ref, computed, nextTick, ref } from 'vue'

import { mapConfigPlugins } from './map-config-plugins'

const document = {} as never
const operation = {} as never
const envVariables = {}

const createMockFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '/api/test' },
  method: 'GET',
  proxy: { proxyUrl: '' },
  query: { params: new URLSearchParams() },
  headers: new Headers(),
  body: null,
  cookies: { list: [] },
  cache: 'default',
  security: [],
  ...overrides,
})

const beforePayload = (request: RequestFactory) => ({ request, document, operation, envVariables })

describe('mapConfigPlugins', () => {
  /**
   * Test 1: Type-safe transformation of onBeforeRequest to beforeRequest hook
   * Critical because this ensures the request modification pipeline works correctly
   */
  it('transforms onBeforeRequest callback into a ClientPlugin with beforeRequest hook that returns modified request', async () => {
    const mockRequest = createMockFactory({
      headers: new Headers({ 'X-Original': 'true' }),
    })

    const onBeforeRequestMock = vi.fn(async ({ request }: { request: RequestFactory }) => {
      const modifiedRequest: RequestFactory = {
        ...request,
        method: 'POST',
        path: { ...request.path, raw: '/api/modified' },
        headers: new Headers(request.headers),
      }
      modifiedRequest.headers.set('X-Modified', 'true')
      return { request: modifiedRequest }
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    expect(plugins).toHaveLength(1)
    expect(plugins[0]).toHaveProperty('hooks')
    expect(plugins[0]?.hooks).toHaveProperty('beforeRequest')

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    expect(beforeRequestHook).toBeDefined()

    if (beforeRequestHook) {
      const input = beforePayload(mockRequest)
      const result = await beforeRequestHook(input)

      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
      expect(onBeforeRequestMock).toHaveBeenCalledWith(input)

      expect(result?.request.method).toBe('POST')
      expect(result?.request.path.raw).toBe('/api/modified')
      expect(result?.request.headers.get('X-Modified')).toBe('true')
    }
  })

  it('handles void return from onBeforeRequest by returning original payload', async () => {
    const mockRequest = createMockFactory({
      headers: new Headers({ 'X-Test': 'true' }),
    })

    const onBeforeRequestMock = vi.fn(async () => {
      await Promise.resolve()
      console.log('Request intercepted')
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    expect(beforeRequestHook).toBeDefined()

    if (beforeRequestHook) {
      const input = beforePayload(mockRequest)
      const result = await beforeRequestHook(input)

      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual(input)
      expect(result?.request).toBe(mockRequest)
    }
  })

  it('transforms onRequestSent callback into a ClientPlugin with responseReceived hook that extracts request URL', async () => {
    const mockRequest = createMockFactory({
      path: { variables: {}, raw: '/api/endpoint' },
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

    const plugins: ClientPlugin[] = mapConfigPlugins(config)

    expect(plugins).toHaveLength(1)
    expect(plugins[0]?.hooks).toHaveProperty('responseReceived')

    const responseReceivedHook = plugins[0]?.hooks?.responseReceived
    expect(responseReceivedHook).toBeDefined()

    if (responseReceivedHook) {
      await responseReceivedHook({
        response: mockResponse,
        request: mockRequest,
        requestUrl: 'https://example.com/api/endpoint',
        document,
        operation: {
          operationId: 'test-operation',
          method: 'post',
          path: '/endpoint',
        } as any,
        envVariables,
      })

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

    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    const hooks = plugins[0]?.hooks
    assert(hooks)
    assert(hooks.beforeRequest)

    await hooks.beforeRequest(beforePayload(createMockFactory()))
    expect(fn).toHaveBeenCalledTimes(1)

    config.value.onBeforeRequest = secondCallback
    await nextTick()

    await hooks.beforeRequest(beforePayload(createMockFactory()))
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('updates responseReceived hook when onRequestSent callback changes in config', async () => {
    const mockRequest = createMockFactory()
    const mockResponse = new Response('{"data": "test"}', { status: 200 })
    const mockOperation = { operationId: 'test-operation', method: 'get', path: '/test' } as any
    const fn = vi.fn()

    const firstCallback = (url: string) => {
      fn('first')
      void url
    }

    const secondCallback = (url: string) => {
      fn('second')
      void url
    }

    const config = ref({
      onRequestSent: firstCallback,
    }) as Ref<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    const hooks = plugins[0]?.hooks
    assert(hooks)
    assert(hooks.responseReceived)

    const responsePayload = {
      response: mockResponse,
      request: mockRequest,
      requestUrl: 'https://example.com/api/test',
      document,
      operation: mockOperation,
      envVariables,
    }

    await hooks.responseReceived(responsePayload)
    expect(fn).toHaveBeenCalledTimes(1)

    config.value.onRequestSent = secondCallback
    await nextTick()

    await hooks.responseReceived(responsePayload)
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

    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    const hooks = plugins[0]?.hooks
    assert(hooks)

    expect(hooks.beforeRequest).toBeUndefined()

    config.value.onBeforeRequest = firstCallback
    await nextTick()

    await hooks.beforeRequest?.(beforePayload(createMockFactory()))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
  })

  it('removes hooks when callbacks are removed from config', async () => {
    const fn = vi.fn()

    const firstCallback = (it: any) => {
      fn('first')
      return it
    }

    const config = ref({
      onBeforeRequest: firstCallback,
    }) as Ref<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    const hooks = plugins[0]?.hooks
    assert(hooks)
    assert(hooks.beforeRequest)

    await hooks.beforeRequest?.(beforePayload(createMockFactory()))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')

    config.value.onBeforeRequest = undefined
    await nextTick()

    expect(hooks.beforeRequest).toBeUndefined()
  })
})
