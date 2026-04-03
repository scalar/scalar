import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { RequestFactory } from '@scalar/workspace-store/request-example'
import { assert, describe, expect, it, vi } from 'vitest'
import { type ComputedRef, type Ref, computed, nextTick, ref } from 'vue'

import { mapConfigPlugins } from './map-config-plugins'

const document = {} as never
const operation = {} as never

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

const beforePayload = (requestBuilder: RequestFactory) => ({
  requestBuilder,
  document,
  operation,
})

const responsePayload = (requestBuilder: RequestFactory, fetchRequest: Request) => ({
  response: new Response('{"data": "test"}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }),
  requestBuilder,
  request: fetchRequest,
  document,
  operation: {
    operationId: 'test-operation',
    method: 'post',
    path: '/endpoint',
  } as any,
})

describe('mapConfigPlugins', () => {
  it('transforms onBeforeRequest callback into a ClientPlugin with beforeRequest hook that mutates request builder', async () => {
    const mockRequestBuilder = createMockFactory({
      headers: new Headers({ 'X-Original': 'true' }),
    })

    const onBeforeRequestMock = vi.fn(({ requestBuilder }: { requestBuilder: RequestFactory }) => {
      requestBuilder.method = 'POST'
      requestBuilder.path = { ...requestBuilder.path, raw: '/api/modified' }
      requestBuilder.headers.set('X-Modified', 'true')
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
      const input = beforePayload(mockRequestBuilder)
      await beforeRequestHook(input)

      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
      expect(onBeforeRequestMock).toHaveBeenCalledWith({
        request: expect.any(Request),
        requestBuilder: mockRequestBuilder,
      })

      expect(mockRequestBuilder.method).toBe('POST')
      expect(mockRequestBuilder.path.raw).toBe('/api/modified')
      expect(mockRequestBuilder.headers.get('X-Modified')).toBe('true')
    }
  })

  it('handles void return from onBeforeRequest by returning original payload', async () => {
    const mockRequestBuilder = createMockFactory({
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
      const input = beforePayload(mockRequestBuilder)
      await beforeRequestHook(input)

      expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
      expect(input.requestBuilder).toBe(mockRequestBuilder)
    }
  })

  it('transforms onRequestSent callback into a ClientPlugin with responseReceived hook that extracts request URL', async () => {
    const requestBuilder = createMockFactory({
      path: { variables: {}, raw: '/api/endpoint' },
      method: 'POST',
    })
    const fetchRequest = new Request('https://example.com/api/endpoint', { method: 'POST' })

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
      await responseReceivedHook(responsePayload(requestBuilder, fetchRequest))

      expect(onRequestSentMock).toHaveBeenCalledTimes(1)
      expect(onRequestSentMock).toHaveBeenCalledWith('https://example.com/api/endpoint')
    }
  })

  it('updates beforeRequest hook when onBeforeRequest callback changes in config', async () => {
    const fn = vi.fn()

    const firstCallback = () => {
      fn('first')
    }

    const secondCallback = () => {
      fn('second')
    }

    const config = ref({
      onBeforeRequest: firstCallback,
    }) as unknown as Ref<ApiReferenceConfigurationRaw>

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
    const requestBuilder = createMockFactory()
    const fetchRequest = new Request('https://example.com/api/test', { method: 'GET' })
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
    }) as unknown as Ref<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(computed(() => config.value))

    const hooks = plugins[0]?.hooks
    assert(hooks)
    assert(hooks.responseReceived)

    const payload = {
      response: new Response('{"data": "test"}', { status: 200 }),
      requestBuilder,
      request: fetchRequest,
      document,
      operation: mockOperation,
    }

    await hooks.responseReceived(payload)
    expect(fn).toHaveBeenCalledTimes(1)

    config.value.onRequestSent = secondCallback
    await nextTick()

    await hooks.responseReceived(payload)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('adds hooks when callbacks are added to an initially empty config', async () => {
    const fn = vi.fn()

    const firstCallback = () => {
      fn('first')
    }

    const config = ref({}) as unknown as Ref<ApiReferenceConfigurationRaw>

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

    const firstCallback = () => {
      fn('first')
    }

    const config = ref({
      onBeforeRequest: firstCallback,
    }) as unknown as Ref<ApiReferenceConfigurationRaw>

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
