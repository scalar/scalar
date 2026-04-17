import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { RequestFactory } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { assert, describe, expect, it, vi } from 'vitest'
import { type ComputedRef, type Ref, computed, nextTick, ref } from 'vue'

import { mapConfigPlugins } from './map-config-plugins'

const document = {} as never
const operation = {} as never

const createMockEnvironment = (
  variables: Array<{ name: string; value: string | { default: string; description: string } }> = [],
): ComputedRef<XScalarEnvironment> =>
  computed(() => ({
    color: '#FFFFFF',
    variables,
  }))

const createMockFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  options: {},
  baseUrl: 'https://example.com',
  path: { variables: {}, raw: '/api/test' },
  method: 'GET',
  proxyUrl: '',
  query: new URLSearchParams(),
  headers: new Headers(),
  body: null,
  cookies: [],
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

    const plugins: ClientPlugin[] = mapConfigPlugins(config, createMockEnvironment())

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
        envVariables: expect.any(Object),
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

    const plugins: ClientPlugin[] = mapConfigPlugins(config, createMockEnvironment())

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

    const plugins: ClientPlugin[] = mapConfigPlugins(config, createMockEnvironment())

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

    const plugins: ClientPlugin[] = mapConfigPlugins(
      computed(() => config.value),
      createMockEnvironment(),
    )

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

    const plugins: ClientPlugin[] = mapConfigPlugins(
      computed(() => config.value),
      createMockEnvironment(),
    )

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

    const plugins: ClientPlugin[] = mapConfigPlugins(
      computed(() => config.value),
      createMockEnvironment(),
    )

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

    const plugins: ClientPlugin[] = mapConfigPlugins(
      computed(() => config.value),
      createMockEnvironment(),
    )

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

  it('substitutes environment variables in request headers when building request', async () => {
    const mockRequestBuilder = createMockFactory({
      headers: new Headers({ Authorization: 'Bearer {{API_TOKEN}}' }),
    })

    const environment = createMockEnvironment([{ name: 'API_TOKEN', value: 'secret-token-123' }])

    let capturedRequest: Request | undefined

    const onBeforeRequestMock = vi.fn(({ request }: { request: Request }) => {
      capturedRequest = request
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config, environment)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    assert(beforeRequestHook)

    await beforeRequestHook(beforePayload(mockRequestBuilder))

    expect(onBeforeRequestMock).toHaveBeenCalledTimes(1)
    assert(capturedRequest)
    expect(capturedRequest.headers.get('Authorization')).toBe('Bearer secret-token-123')
  })

  it('substitutes multiple environment variables in request', async () => {
    const mockRequestBuilder = createMockFactory({
      baseUrl: '{{BASE_URL}}',
      path: { variables: { version: '{{API_VERSION}}' }, raw: '/{version}/users' },
      headers: new Headers({
        'X-Api-Key': '{{API_KEY}}',
        'X-Custom': '{{CUSTOM_HEADER}}',
      }),
    })

    const environment = createMockEnvironment([
      { name: 'BASE_URL', value: 'https://api.example.com' },
      { name: 'API_VERSION', value: 'v2' },
      { name: 'API_KEY', value: 'my-api-key' },
      { name: 'CUSTOM_HEADER', value: 'custom-value' },
    ])

    let capturedRequest: Request | undefined

    const onBeforeRequestMock = vi.fn(({ request }: { request: Request }) => {
      capturedRequest = request
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config, environment)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    assert(beforeRequestHook)

    await beforeRequestHook(beforePayload(mockRequestBuilder))

    assert(capturedRequest)
    expect(capturedRequest.url).toBe('https://api.example.com/v2/users')
    expect(capturedRequest.headers.get('X-Api-Key')).toBe('my-api-key')
    expect(capturedRequest.headers.get('X-Custom')).toBe('custom-value')
  })

  it('leaves unmatched environment variable placeholders unchanged', async () => {
    const mockRequestBuilder = createMockFactory({
      headers: new Headers({ 'X-Token': '{{UNDEFINED_VAR}}' }),
    })

    const environment = createMockEnvironment([{ name: 'OTHER_VAR', value: 'some-value' }])

    let capturedRequest: Request | undefined

    const onBeforeRequestMock = vi.fn(({ request }: { request: Request }) => {
      capturedRequest = request
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config, environment)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    assert(beforeRequestHook)

    await beforeRequestHook(beforePayload(mockRequestBuilder))

    assert(capturedRequest)
    expect(capturedRequest.headers.get('X-Token')).toBe('{{UNDEFINED_VAR}}')
  })

  it('handles environment variables with default values in object format', async () => {
    const mockRequestBuilder = createMockFactory({
      headers: new Headers({ 'X-Env': '{{ENV_WITH_DEFAULT}}' }),
    })

    const environment = createMockEnvironment([
      {
        name: 'ENV_WITH_DEFAULT',
        value: { default: 'default-value', description: 'A variable with default' },
      },
    ])

    let capturedRequest: Request | undefined

    const onBeforeRequestMock = vi.fn(({ request }: { request: Request }) => {
      capturedRequest = request
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config, environment)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    assert(beforeRequestHook)

    await beforeRequestHook(beforePayload(mockRequestBuilder))

    assert(capturedRequest)
    expect(capturedRequest.headers.get('X-Env')).toBe('default-value')
  })

  it('works with empty environment variables array', async () => {
    const mockRequestBuilder = createMockFactory({
      headers: new Headers({ 'X-Static': 'static-value' }),
    })

    const environment = createMockEnvironment([])

    let capturedRequest: Request | undefined

    const onBeforeRequestMock = vi.fn(({ request }: { request: Request }) => {
      capturedRequest = request
    })

    const config = computed(() => ({
      onBeforeRequest: onBeforeRequestMock as any,
    })) as ComputedRef<ApiReferenceConfigurationRaw>

    const plugins: ClientPlugin[] = mapConfigPlugins(config, environment)

    const beforeRequestHook = plugins[0]?.hooks?.beforeRequest
    assert(beforeRequestHook)

    await beforeRequestHook(beforePayload(mockRequestBuilder))

    assert(capturedRequest)
    expect(capturedRequest.headers.get('X-Static')).toBe('static-value')
  })
})
