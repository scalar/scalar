import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import type { AuthMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientLayout } from '@/hooks/useLayout'
import { ERRORS } from '@/libs/errors'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'

import { buildRequest } from './helpers/build-request'
import { type ResponseInstance, sendRequest } from './helpers/send-request'
import OperationBlock from './OperationBlock.vue'

vi.mock('./helpers/build-request')
vi.mock('./helpers/send-request')

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

/**
 * Creates default props for mounting the OperationBlock component.
 * These props represent the minimum required to render the component.
 */
const createDefaultProps = () => ({
  eventBus: createMockEventBus(),
  appVersion: '1.0.0',
  proxyUrl: '',
  globalCookies: [] as ExtendedScalarCookie[],
  path: '/api/users',
  method: 'get' as const,
  httpClients: AVAILABLE_CLIENTS,
  layout: 'desktop' as ClientLayout,
  server: { url: 'https://api.example.com' },
  selectedClient: 'js/fetch' as const,
  servers: [{ url: 'https://api.example.com' }],
  history: [],
  totalPerformedRequests: 0,
  operation: createMockOperation(),
  exampleKey: 'default',
  authMeta: createMockAuthMeta(),
  securitySchemes: {},
  operationSelectedSecurity: undefined,
  documentSecurity: undefined,
  documentSelectedSecurity: undefined,
  setOperationSecurity: false,
  plugins: [],
  environment: createMockEnvironment(),
})

describe('OperationBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToast.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('executes request when handleExecute is called', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(buildRequest).toHaveBeenCalledOnce()
    expect(sendRequest).toHaveBeenCalledOnce()
  })

  it('displays toast error when buildRequest fails', async () => {
    const mockError = new Error('Invalid URL')
    vi.mocked(buildRequest).mockReturnValue([mockError, null])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(mockToast).toHaveBeenCalledWith('Invalid URL', 'error')
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('displays toast error when sendRequest fails', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

    const mockError = new Error(ERRORS.REQUEST_FAILED)
    vi.mocked(sendRequest).mockResolvedValue([mockError, null])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(mockToast).toHaveBeenCalledWith(ERRORS.REQUEST_FAILED, 'error')
  })

  it('stores abort controller when request is initiated', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    const abortController = instance.abortController
    expect(abortController).toBe(mockController)
  })

  it('cancels request when cancelRequest is called', async () => {
    const mockController = new AbortController()
    const abortSpy = vi.spyOn(mockController, 'abort')
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()
    instance.cancelRequest()

    expect(abortSpy).toHaveBeenCalledWith(ERRORS.REQUEST_ABORTED)
  })

  it('passes all required props to buildRequest', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const mockCookie: ExtendedScalarCookie = {
      name: 'session',
      value: 'abc123',
      domain: 'example.com',
      location: 'document',
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        globalCookies: [mockCookie],
        proxyUrl: 'https://proxy.example.com',
      },
    })

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(buildRequest).toHaveBeenCalledWith({
      environment: wrapper.props().environment,
      exampleKey: 'default',
      globalCookies: [mockCookie],
      method: 'get',
      operation: wrapper.props().operation,
      path: '/api/users',
      selectedSecuritySchemes: [],
      server: wrapper.props().server,
      proxyUrl: 'https://proxy.example.com',
    })
  })

  it('passes plugins to sendRequest', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: true,
      },
    ])

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        request: mockRequest,
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const mockPlugin = {
      hooks: {
        beforeRequest: vi.fn((req: { request: Request }) => req),
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        plugins: [mockPlugin],
      },
    })

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(sendRequest).toHaveBeenCalledWith({
      isUsingProxy: true,
      operation: wrapper.props().operation,
      plugins: [mockPlugin],
      request: mockRequest,
    })
  })

  it('stores response after successful request execution', async () => {
    const mockController = new AbortController()
    const mockRequest = new Request('https://api.example.com/api/users')

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    const response = instance.response
    expect(response).toStrictEqual(mockResponse)
    expect(response.status).toBe(200)
    expect(response.data).toBe('{"users": []}')
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

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(instance.response).not.toBeNull()
    expect(instance.request).not.toBeNull()

    await wrapper.setProps({ path: '/api/posts' })
    await wrapper.vm.$nextTick()

    expect(instance.response).toBeNull()
    expect(instance.request).toBeNull()
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

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(instance.response).not.toBeNull()
    expect(instance.request).not.toBeNull()

    await wrapper.setProps({ method: 'post' })
    await wrapper.vm.$nextTick()

    expect(instance.response).toBeNull()
    expect(instance.request).toBeNull()
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

    vi.mocked(buildRequest).mockReturnValue([
      null,
      {
        controller: mockController,
        request: mockRequest,
        isUsingProxy: false,
      },
    ])

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

    const instance = wrapper.vm as any
    await instance.handleExecute()

    expect(instance.response).not.toBeNull()
    expect(instance.request).not.toBeNull()

    await wrapper.setProps({ exampleKey: 'alternative-example' })
    await wrapper.vm.$nextTick()

    expect(instance.response).toBeNull()
    expect(instance.request).toBeNull()
  })
})
