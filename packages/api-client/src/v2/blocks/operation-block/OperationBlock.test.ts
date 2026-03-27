import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import type { AuthMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { buildRequest, requestFactory } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientLayout } from '@/hooks/useLayout'
import { ERRORS } from '@/libs/errors'

import { responseCache } from './helpers/response-cache'
import { type ResponseInstance, sendRequest } from './helpers/send-request'
import OperationBlock, { type OperationBlockProps } from './OperationBlock.vue'

vi.mock('@scalar/workspace-store/request-example', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/workspace-store/request-example')>()
  return {
    ...actual,
    buildRequest: vi.fn(),
    requestFactory: vi.fn(),
  }
})

vi.mock('./helpers/send-request')

vi.mock('@scalar/oas-utils/helpers', () => ({
  executeHook: vi.fn().mockResolvedValue(undefined),
}))

/**
 * Mock the toast composable to capture toast calls in tests.
 */
const mockToast = vi.fn()
vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({
    toast: mockToast,
  }),
}))

/**
 * Mock the child components to avoid rendering issues in tests.
 * We focus on testing the OperationBlock logic, not the child components.
 */
vi.mock('./components/Header.vue', () => ({
  default: {
    name: 'Header',
    emits: ['execute', 'select:history:item'],
    template: '<div data-test="header"></div>',
  },
}))

vi.mock('@/v2/blocks/request-block', () => ({
  RequestBlock: {
    name: 'RequestBlock',
    template: '<div data-test="request-block"></div>',
  },
}))

vi.mock('@/v2/blocks/response-block', () => ({
  ResponseBlock: {
    name: 'ResponseBlock',
    props: ['appVersion', 'eventBus', 'layout', 'plugins', 'request', 'response', 'totalPerformedRequests'],
    template: '<div data-test="response-block"></div>',
  },
}))

vi.mock('@/components/ViewLayout/ViewLayout.vue', () => ({
  default: {
    name: 'ViewLayout',
    template: '<div data-test="view-layout"><slot /></div>',
  },
}))

vi.mock('@/components/ViewLayout/ViewLayoutContent.vue', () => ({
  default: {
    name: 'ViewLayoutContent',
    template: '<div data-test="view-layout-content"><slot /></div>',
  },
}))

/**
 * Creates a minimal mock event bus for testing.
 * We only implement the methods that OperationBlock uses.
 */
const createMockEventBus = (): WorkspaceEventBus => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(() => null),
})

/**
 * Creates a minimal mock environment for testing.
 * This represents the environment variables available during request execution.
 */
const createMockEnvironment = (): XScalarEnvironment => ({
  color: 'blue',
  variables: [],
})

/**
 * Creates a minimal mock operation for testing.
 * This represents an OpenAPI operation object.
 */
const createMockOperation = (overrides: Partial<OperationObject> = {}): OperationObject =>
  ({
    operationId: 'test-operation',
    summary: 'Test operation',
    description: 'Test operation description',
    tags: [],
    parameters: [],
    responses: {},
    ...overrides,
  }) as OperationObject

/**
 * Creates a minimal mock authMeta for testing.
 * This represents the authentication metadata for the operation.
 */
const createMockAuthMeta = (): AuthMeta => ({
  type: 'operation',
  path: '/api/users',
  method: 'get',
})

const createMockOriginalResponse = (): Response =>
  new Response(null, {
    status: 200,
    statusText: 'OK',
    headers: {},
  })

type RequestFactoryPayload = Parameters<typeof buildRequest>[0]

const createDefaultRequestFactoryPayload = (overrides: Partial<RequestFactoryPayload> = {}): RequestFactoryPayload => {
  const { proxy: proxyOverrides, ...rest } = overrides
  return {
    baseUrl: 'https://api.example.com',
    method: 'GET',
    headers: new Headers(),
    body: null,
    cookies: {
      list: [],
    },
    cache: 'default',
    security: [],
    proxy: {
      proxyUrl: '',
      ...proxyOverrides,
    },
    path: {
      variables: {},
      raw: '/api/users',
    },
    query: {
      params: new URLSearchParams(),
    },
    ...rest,
  }
}

/**
 * OperationBlock uses script setup; execute is wired from Header @execute.
 */
const triggerExecute = async (wrapper: ReturnType<typeof mount<typeof OperationBlock>>) => {
  const header = wrapper.findComponent({ name: 'Header' })
  expect(header.exists()).toBe(true)
  header.vm.$emit('execute')
  await flushPromises()
}

const getResponseBlockProps = (wrapper: ReturnType<typeof mount<typeof OperationBlock>>) =>
  wrapper.findComponent({ name: 'ResponseBlock' }).props() as {
    response: ResponseInstance | null | undefined
    request: Request | null | undefined
  }

const getEventBusHandler = (mockBus: WorkspaceEventBus, event: string): (() => void) | undefined => {
  const call = vi.mocked(mockBus.on).mock.calls.find((c) => c[0] === event)
  return call?.[1] as (() => void) | undefined
}

/**
 * Creates default props for mounting the OperationBlock component.
 * These props represent the minimum required to render the component.
 */
const createDefaultProps = (): OperationBlockProps => ({
  eventBus: createMockEventBus(),
  appVersion: '1.0.0',
  proxyUrl: '',
  workspaceCookies: [],
  documentCookies: [],
  path: '/api/users',
  method: 'get' as const,
  httpClients: AVAILABLE_CLIENTS,
  layout: 'desktop' as ClientLayout,
  server: { url: 'https://api.example.com' },
  selectedClient: 'js/fetch' as const,
  servers: [{ url: 'https://api.example.com' }],
  history: [],
  operation: createMockOperation(),
  exampleKey: 'default',
  authMeta: createMockAuthMeta(),
  securitySchemes: {},
  securityRequirements: undefined,
  selectedSecurity: { selectedIndex: -1, selectedSchemes: [] },
  selectedSecuritySchemes: [],
  defaultHeaders: {},
  plugins: [],
  environment: createMockEnvironment(),
  serverMeta: {
    type: 'document',
  },
})

describe('OperationBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToast.mockClear()

    const mockController = new AbortController()
    const mockFetchRequest = new Request('https://api.example.com/api/users')

    vi.mocked(requestFactory).mockImplementation((args) => ({
      request: createDefaultRequestFactoryPayload({
        proxy: { proxyUrl: args.proxyUrl },
      }),
    }))

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockFetchRequest,
      isUsingProxy: false,
    })
  })

  afterEach(() => {
    responseCache.clear()
  })

  it('renders without errors with minimal props', () => {
    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('registers event listeners on mount and unregisters on unmount', () => {
    const mockEventBus = createMockEventBus()
    const props = createDefaultProps()
    props.eventBus = mockEventBus

    const wrapper = mount(OperationBlock, { props })

    expect(mockEventBus.on).toHaveBeenCalledWith('operation:send:request:hotkey', expect.any(Function))
    expect(mockEventBus.on).toHaveBeenCalledWith('operation:cancel:request', expect.any(Function))

    wrapper.unmount()

    expect(mockEventBus.off).toHaveBeenCalledWith('operation:send:request:hotkey', expect.any(Function))
    expect(mockEventBus.off).toHaveBeenCalledWith('operation:cancel:request', expect.any(Function))
  })

  it('executes request when execute is emitted from Header', async () => {
    const mockRequest = new Request('https://api.example.com/api/users')

    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"success": true}',
      size: 20,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    const mockOriginalResponse = new Response(mockResponse.body, {
      status: mockResponse.status,
      statusText: mockResponse.statusText,
      headers: mockResponse.headers,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: mockOriginalResponse,
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(sendRequest).toHaveBeenCalledOnce()
    expect(sendRequest).toHaveBeenCalledWith({
      isUsingProxy: false,
      request: expect.any(Request),
    })
  })

  it('displays toast error when sendRequest fails', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    const mockError = new Error(ERRORS.REQUEST_FAILED)
    vi.mocked(sendRequest).mockResolvedValue([mockError, null])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(mockToast).toHaveBeenCalledWith(ERRORS.REQUEST_FAILED, 'error')
  })

  it('cancels request when cancelRequest is invoked via event bus', async () => {
    const mockEventBus = createMockEventBus()
    const mockController = new AbortController()
    const abortSpy = vi.spyOn(mockController, 'abort')
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), eventBus: mockEventBus },
    })

    await triggerExecute(wrapper)

    const cancelHandler = getEventBusHandler(mockEventBus, 'operation:cancel:request')
    expect(cancelHandler).toBeDefined()
    cancelHandler?.()

    expect(abortSpy).toHaveBeenCalledWith(ERRORS.REQUEST_ABORTED)
    wrapper.unmount()
  })

  it('passes props to requestFactory and buildRequest', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const mockCookie: XScalarCookie = {
      name: 'session',
      value: 'abc123',
      domain: 'example.com',
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        documentCookies: [mockCookie],
        proxyUrl: 'https://proxy.example.com',
      },
    })

    await triggerExecute(wrapper)

    expect(requestFactory).toHaveBeenCalledWith({
      defaultHeaders: {},
      environment: wrapper.props().environment,
      exampleName: 'default',
      globalCookies: [mockCookie],
      method: 'get',
      operation: wrapper.props().operation,
      path: '/api/users',
      proxyUrl: 'https://proxy.example.com',
      server: wrapper.props().server,
      selectedSecuritySchemes: [],
      isElectron: expect.any(Boolean),
    })

    expect(buildRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://api.example.com',
        proxy: {
          proxyUrl: 'https://proxy.example.com',
        },
      }),
      {
        envVariables: {},
      },
    )
  })

  it('passes isUsingProxy from request factory to sendRequest', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(requestFactory).mockReturnValue({
      request: createDefaultRequestFactoryPayload({
        proxy: { proxyUrl: 'https://proxy.example.com' },
      }),
    })

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: true,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(sendRequest).toHaveBeenCalledWith({
      isUsingProxy: true,
      request: expect.any(Request),
    })
  })

  it('stores response after successful request execution', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      cookieHeaderKeys: [],
      duration: 150,
      method: 'get',
      path: '/api/users',
      data: '{"users": []}',
      size: 14,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    const { response } = getResponseBlockProps(wrapper)
    expect(response).toStrictEqual(mockResponse)
    expect(response?.status).toBe(200)
    expect(response && 'data' in response ? response.data : undefined).toBe('{"users": []}')
  })

  it('clears response and request when path changes', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')
    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"success": true}',
      size: 20,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).request).not.toBeNull()

    await wrapper.setProps({ path: '/api/posts' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).request).toBeNull()
  })

  it('clears response and request when method changes', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')
    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"success": true}',
      size: 20,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).request).not.toBeNull()

    await wrapper.setProps({ method: 'post' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).request).toBeNull()
  })

  it('clears response and request when exampleKey changes', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')
    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"success": true}',
      size: 20,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).request).not.toBeNull()

    await wrapper.setProps({ exampleKey: 'alternative-example' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).request).toBeNull()
  })

  it('restores response from cache when navigating back to same operation', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')
    const mockResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"users": []}',
      size: 14,
      ok: true,
      redirected: false,
      type: 'basic',
      url: 'https://api.example.com/api/users',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      clone: vi.fn(),
      bytes: vi.fn(),
    }

    vi.mocked(buildRequest).mockReturnValue({
      controller: mockController,
      request: mockRequest,
      isUsingProxy: false,
    })

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: mockResponse,
        originalResponse: new Response(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    const stateAfterExecute = getResponseBlockProps(wrapper).response
    expect(stateAfterExecute).not.toBeNull()
    expect(stateAfterExecute && 'data' in stateAfterExecute ? stateAfterExecute.data : undefined).toBe('{"users": []}')

    await wrapper.setProps({ path: '/api/posts' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()

    await wrapper.setProps({ path: '/api/users' })
    await wrapper.vm.$nextTick()

    const restored = getResponseBlockProps(wrapper).response
    expect(restored).not.toBeNull()
    expect(restored && 'data' in restored ? restored.data : undefined).toBe('{"users": []}')
    expect(getResponseBlockProps(wrapper).request).not.toBeNull()
  })
})
