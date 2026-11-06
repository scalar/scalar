import { createHash } from 'node:crypto'

import { ERRORS } from '@scalar/helpers/errors/normalize-error'
import { buildSafeBodyRequest } from '@scalar/helpers/http/can-method-have-body'
import { err, ok } from '@scalar/helpers/types/result'
import { type ClientPlugin, executeHook } from '@scalar/oas-utils/helpers'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type AuthMeta, type WorkspaceEventBus, createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import { type RequestPayload, buildRequest, requestFactory } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import type { OpenApiDocument, ParameterObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.2/strict/operation'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'

import ResponseBodyStreaming from '@/v2/blocks/response-block/components/ResponseBodyStreaming.vue'
import ResponseBlock from '@/v2/blocks/response-block/ResponseBlock.vue'
import { createMockEventBus } from '@/v2/helpers/test-utils'
import type { ClientLayout } from '@/v2/types/layout'

import { responseCache } from './helpers/response-cache'
import { type ResponseInstance, sendRequest } from './helpers/send-request'
import OperationBlock, { type OperationBlockProps } from './OperationBlock.vue'

const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
vi.mock('@scalar/use-hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: mockCopyToClipboard }),
}))

vi.mock('@scalar/workspace-store/request-example', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/workspace-store/request-example')>()
  return {
    ...actual,
    buildRequest: vi.fn(),
    requestFactory: vi.fn(),
  }
})

vi.mock('./helpers/send-request')

vi.mock('@scalar/oas-utils/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/oas-utils/helpers')>()
  return {
    ...actual,
    // Wrap the real implementation so plugin hooks run while calls remain inspectable
    executeHook: vi.fn(actual.executeHook),
  }
})

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
    props: ['displayPath'],
    emits: ['execute', 'select:history:item', 'update:webhook-url'],
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
    props: [
      'appVersion',
      'eventBus',
      'layout',
      'plugins',
      'requestPayload',
      'requestError',
      'response',
      'totalPerformedRequests',
    ],
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
  return {
    options: {},
    baseUrl: 'https://api.example.com',
    method: 'GET',
    headers: new Headers(),
    body: null,
    cookies: [],
    cache: 'default',
    security: [],
    proxyUrl: '',
    path: {
      variables: {},
      raw: '/api/users',
    },
    query: new URLSearchParams(),
    ...overrides,
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
    requestPayload: RequestPayload | null | undefined
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
  documentSlug: 'test-document',
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
  document: {} as OpenApiDocument,
})

/** Exercise the real serializer through the embedded operation view. */
const mountUrlPreview = async (
  overrides: Partial<OperationBlockProps> = {},
): Promise<ReturnType<typeof mount<typeof OperationBlock>>> => {
  const actual = await vi.importActual<typeof import('@scalar/workspace-store/request-example')>(
    '@scalar/workspace-store/request-example',
  )
  vi.mocked(requestFactory).mockImplementation(actual.requestFactory)
  return mount(OperationBlock, {
    props: {
      ...createDefaultProps(),
      eventBus: createWorkspaceEventBus(),
      document: {
        openapi: '3.0.3',
        info: { title: 'Request URL', version: '1' },
        'x-scalar-original-document-hash': '',
      },
      layout: 'modal',
      path: '/badges',
      server: { url: 'http://localhost:9000' },
      ...overrides,
    },
  })
}

describe('OperationBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToast.mockClear()

    const mockController = new AbortController()

    vi.mocked(requestFactory).mockImplementation((args) => ({
      request: createDefaultRequestFactoryPayload({
        proxyUrl: args.proxyUrl,
      }),
    }))

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )
  })

  afterEach(() => {
    responseCache.clear()
  })

  it('previews enabled query values reactively and keeps Copy URL consistent without executing hooks', async () => {
    const code = reactive({
      name: 'code',
      in: 'query' as const,
      required: true,
      schema: { type: 'string' as const },
      examples: { default: { value: 'ABC123' } },
    })
    const limit = reactive({
      name: 'limit',
      in: 'query' as const,
      schema: { type: 'integer' as const },
      examples: { default: { value: 10, 'x-disabled': false } },
    })
    const wrapper = await mountUrlPreview({ operation: { parameters: [code, limit] } })
    const preview = (): string => wrapper.getComponent({ name: 'Header' }).props('displayPath')
    expect(preview()).toBe('/badges?code=ABC123&limit=10')

    code.examples.default.value = 'A + B&/é'
    await nextTick()
    expect(preview()).toBe('/badges?code=A+%2B+B%26%2F%C3%A9&limit=10')

    limit.examples.default['x-disabled'] = true
    await nextTick()
    expect(preview()).toBe('/badges?code=A+%2B+B%26%2F%C3%A9')

    limit.examples.default['x-disabled'] = false
    await nextTick()
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith(`http://localhost:9000${preview()}`)
    expect(vi.mocked(executeHook).mock.calls.map(([, hook]) => hook)).toStrictEqual(['onRequestMount'])
    expect(sendRequest).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('preserves repeated query values and merges existing queries once, matching Copy URL', async () => {
    const wrapper = await mountUrlPreview({
      path: '/badges?tag=old&fixed=1',
      server: { url: 'https://example.com/api?region=eu' },
      operation: {
        parameters: [
          {
            name: 'tag',
            in: 'query',
            style: 'form',
            explode: true,
            schema: { type: 'array', items: { type: 'string' } },
            examples: { default: { value: ['a+b', 'two words'], 'x-disabled': false } },
          },
        ],
      },
    })
    const url = wrapper.getComponent({ name: 'Header' }).props('displayPath')
    expect(url).toBe('/badges?region=eu&tag=a%2Bb&tag=two+words&fixed=1')
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith(`https://example.com/api${url}`)
    wrapper.unmount()
  })

  it('updates the preview for path, server, environment, and example changes', async () => {
    const wrapper = await mountUrlPreview({
      path: '/badges/{id}',
      server: { url: 'https://{{host}}/{{base}}/{version}', variables: { version: { default: 'v1' } } },
      environment: {
        color: 'blue',
        variables: [
          { name: 'host', value: 'example.com' },
          { name: 'base', value: 'api' },
          { name: 'id', value: 'a/b' },
          { name: 'code', value: 'ABC123' },
        ],
      },
      operation: {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            examples: { default: { value: '{{id}}' }, second: { value: 'other' } },
          },
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            examples: { default: { value: '{{code}}' }, second: { value: 'second' } },
          },
        ],
      },
    })
    const preview = (): string => wrapper.getComponent({ name: 'Header' }).props('displayPath')
    expect(preview()).toBe('/badges/a%2Fb?code=ABC123')
    await wrapper.setProps({
      environment: {
        color: 'blue',
        variables: [
          { name: 'host', value: 'staging.example.com' },
          { name: 'base', value: 'another-base' },
          { name: 'id', value: '42' },
          { name: 'code', value: 'A + B' },
        ],
      },
    })
    expect(preview()).toBe('/badges/42?code=A+%2B+B')
    await wrapper.setProps({ server: { url: 'https://other.example.com/v2' }, exampleKey: 'second' })
    expect(preview()).toBe('/badges/other?code=second')
    wrapper.unmount()
  })

  it('masks query credentials in the address field while copying their actual value', async () => {
    const wrapper = await mountUrlPreview({
      selectedSecuritySchemes: [{ type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': '{{token}}' }],
      environment: { color: 'blue', variables: [{ name: 'token', value: 'secret + value' }] },
    })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/badges?key=*****')
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith('http://localhost:9000/badges?key=secret+%2B+value')
    wrapper.unmount()
  })

  it.each([
    { token: 'secret/with space?', copied: 'secret/with+space%3F' },
    { token: 'key', copied: 'key' },
    { token: 'a', copied: 'a' },
  ])('redacts only the query credential value before reserved serialization ($token)', async ({ token, copied }) => {
    const wrapper = await mountUrlPreview({
      operation: {
        parameters: [
          {
            name: 'key',
            in: 'query',
            allowReserved: true,
            schema: { type: 'string' },
            examples: { default: { value: 'ordinary value', 'x-disabled': false } },
          },
        ],
      },
      selectedSecuritySchemes: [{ type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': token }],
    })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/badges?key=*****')
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith(`http://localhost:9000/badges?key=${copied}`)
    expect(wrapper.props('selectedSecuritySchemes')).toStrictEqual([
      { type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': token },
    ])
    wrapper.unmount()
  })

  it('leaves legitimate paths, query names, and values intact when authentication uses a header', async () => {
    const wrapper = await mountUrlPreview({
      path: '/admin/users',
      operation: {
        parameters: [
          {
            name: 'admin',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            examples: { default: { value: 'admin' } },
          },
        ],
      },
      selectedSecuritySchemes: [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-username': 'admin',
          'x-scalar-secret-password': 'users',
          'x-scalar-secret-token': '',
        },
      ],
    })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/admin/users?admin=admin')
    wrapper.unmount()
  })

  it('preserves reserved query encoding exactly as Copy URL', async () => {
    const wrapper = await mountUrlPreview({
      server: { url: 'https://example.com/api/' },
      operation: {
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            allowReserved: true,
            schema: { type: 'string' },
            examples: { default: { value: "O'Reilly" } },
          },
        ],
      },
    })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe("/badges?q=O'Reilly")
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith("https://example.com/api/badges?q=O'Reilly")
    wrapper.unmount()
  })

  it('does not serialize a POST body when rendering or changing query values or copying its URL', async () => {
    const serializeBody = vi.fn(() => ({ message: 'large request body' }))
    const query = reactive({
      name: 'q',
      in: 'query' as const,
      required: true,
      schema: { type: 'string' as const },
      examples: { default: { value: 'first' } },
    })
    const operation: OperationObject = {
      parameters: [query],
      requestBody: { content: { 'application/json': { examples: { default: { value: { toJSON: serializeBody } } } } } },
    }
    const wrapper = await mountUrlPreview({ method: 'post', operation })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/badges?q=first')
    expect(serializeBody).not.toHaveBeenCalled()
    query.examples.default.value = 'second'
    await nextTick()
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/badges?q=second')
    wrapper.props('eventBus').emit('copy-url:address-bar')
    await flushPromises()
    expect(mockCopyToClipboard).toHaveBeenCalledExactlyOnceWith('http://localhost:9000/badges?q=second')
    expect(serializeBody).not.toHaveBeenCalled()
    vi.mocked(sendRequest).mockResolvedValue([new Error('Stop after request construction'), null])
    await triggerExecute(wrapper)
    expect(serializeBody).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('handles incomplete inputs and webhook destinations without duplicating a server prefix', async () => {
    const wrapper = await mountUrlPreview({ server: { url: 'http://[' } })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBeUndefined()
    await wrapper.setProps({ server: null, path: '/badges/{id}' })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBe('/badges/%7Bid%7D')
    await wrapper.setProps({ isWebhook: true, path: 'badge.created', server: { url: 'https://ignored.example.com' } })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBeUndefined()
    wrapper.getComponent({ name: 'Header' }).vm.$emit('update:webhook-url', 'https://receiver.example.com/hook?tag=one')
    await nextTick()
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBeUndefined()
    await wrapper.setProps({ layout: 'web' })
    expect(wrapper.getComponent({ name: 'Header' }).props('displayPath')).toBeUndefined()
    wrapper.unmount()
  })

  it.each(['CONNECT', 'connect', 'TRACE', 'Trace', 'TRACK', 'tRaCk'])(
    'shows an error instead of sending the final request method %s',
    async (method) => {
      vi.mocked(buildRequest).mockReturnValue(
        ok({
          controller: new AbortController(),
          requestPayload: ['https://api.example.com/api/users', { method, headers: new Headers() }],
          isUsingProxy: false,
        }),
      )
      // The final request can differ from the operation after pre-request scripts run.
      const wrapper = mount(OperationBlock, { props: createDefaultProps() })

      await triggerExecute(wrapper)

      expect(mockToast).toHaveBeenCalledExactlyOnceWith(
        `The Fetch API cannot send ${method.toUpperCase()} requests.`,
        'error',
      )
      expect(sendRequest).not.toHaveBeenCalled()
      expect(vi.mocked(executeHook).mock.calls.some(([, hook]) => hook === 'requestBuilt')).toBe(false)
      wrapper.unmount()
    },
  )

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
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
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
      requestPayload: ['https://api.example.com/api/users', expect.objectContaining({ method: 'GET' })],
      request: expect.any(Request),
      plugins: [],
      customFetch: undefined,
      onResponseReceived: expect.any(Function),
    })
  })

  it('requires an explicit destination before sending a webhook', async () => {
    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        isWebhook: true,
        path: 'delivery.created',
        method: 'post',
        server: null,
        servers: [],
      },
    })

    await triggerExecute(wrapper)

    expect(mockToast).toHaveBeenCalledWith('Webhook URL required. Enter a destination first.', 'error')
    expect(requestFactory).not.toHaveBeenCalled()
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('sends a webhook to its full destination URL without changing its route identity', async () => {
    const eventBus = createMockEventBus()
    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://hooks.example.com/deliveries', { method: 'POST', headers: new Headers() }],
        response: {
          status: 204,
          cookieHeaderKeys: [],
        } as unknown as ResponseInstance,
        originalResponse: new Response(null, { status: 204 }),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus,
        isWebhook: true,
        path: 'delivery.created',
        method: 'post',
        server: null,
        servers: [],
      },
    })
    const header = wrapper.findComponent({ name: 'Header' })
    // The whole URL is the destination — there is no separate server for a webhook.
    header.vm.$emit('update:webhook-url', 'https://hooks.example.com/deliveries')
    await flushPromises()

    await triggerExecute(wrapper)

    expect(requestFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        path: 'https://hooks.example.com/deliveries',
        server: null,
      }),
    )
    expect(eventBus.emit).toHaveBeenCalledWith(
      'hooks:on:request:sent',
      expect.objectContaining({
        meta: {
          method: 'post',
          path: 'delivery.created',
          exampleKey: 'default',
        },
      }),
    )
  })

  it('forwards server and customFetch to beforeRequest plugins', async () => {
    const server = { url: 'https://api.example.com' }
    const customFetch = vi.fn<typeof fetch>()
    const received = vi.fn()
    const plugin: ClientPlugin = {
      hooks: {
        beforeRequest: ({ server, customFetch }) => {
          received({ server, customFetch })
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        server,
        options: { customFetch },
        plugins: [plugin],
      },
    })

    await triggerExecute(wrapper)

    expect(received).toHaveBeenCalledOnce()
    expect(received).toHaveBeenCalledWith({ server, customFetch })
  })

  it('persists server-set cookies into the document jar after a response', async () => {
    const mockEventBus = createMockEventBus()
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: ['csrftoken=abc123; Path=/; SameSite=Lax'],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{}',
      size: 2,
    } as unknown as ResponseInstance

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), eventBus: mockEventBus },
    })

    await triggerExecute(wrapper)

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:upsert:cookie', {
      collectionType: 'document',
      payload: { name: 'csrftoken', value: 'abc123', domain: 'api.example.com', path: '/' },
    })
  })

  it('flushes debounced events before building a request', async () => {
    const mockEventBus = createMockEventBus()
    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), eventBus: mockEventBus },
    })

    await triggerExecute(wrapper)

    const flushDebouncedEmits = mockEventBus.flushDebouncedEmits
    if (!flushDebouncedEmits) {
      throw new Error('Expected flushDebouncedEmits to exist')
    }

    const flushOrder = vi.mocked(flushDebouncedEmits).mock.invocationCallOrder.at(0) ?? 0
    const requestFactoryOrder = vi.mocked(requestFactory).mock.invocationCallOrder[0] ?? 0

    expect(flushOrder).toBeLessThan(requestFactoryOrder)
  })

  it('flushes debounced events before validating path parameters', async () => {
    const pathParameter: ParameterObject = {
      name: 'id',
      in: 'path',
      required: true,
      examples: {
        default: {
          value: '',
        },
      },
    }
    const operation = createMockOperation({
      parameters: [pathParameter],
    })
    const mockEventBus = createMockEventBus()

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        operation,
        path: '/api/users/{id}',
      },
    })

    await triggerExecute(wrapper)

    const flushDebouncedEmits = mockEventBus.flushDebouncedEmits
    if (!flushDebouncedEmits) {
      throw new Error('Expected flushDebouncedEmits to exist')
    }

    const flushOrder = vi.mocked(flushDebouncedEmits).mock.invocationCallOrder.at(0) ?? 0
    const toastOrder = mockToast.mock.invocationCallOrder[0] ?? 0

    expect(flushOrder).toBeLessThan(toastOrder)
    expect(mockToast).toHaveBeenCalledWith('Path parameters must have values.', 'error')
    expect(requestFactory).not.toHaveBeenCalled()
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('uses path parameter values committed by a debounced flush before validation', async () => {
    const pathParameter: ParameterObject = {
      name: 'id',
      in: 'path',
      required: true,
      examples: {
        default: {
          value: '',
        },
      },
    }
    const operation = createMockOperation({
      parameters: [pathParameter],
    })
    const mockEventBus = createMockEventBus()

    const flushDebouncedEmits = mockEventBus.flushDebouncedEmits
    if (!flushDebouncedEmits) {
      throw new Error('Expected flushDebouncedEmits to exist')
    }

    vi.mocked(flushDebouncedEmits).mockImplementation(() => {
      pathParameter.examples = {
        default: {
          value: '123',
        },
      }
    })
    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users/123', { method: 'GET', headers: new Headers() }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        operation,
        path: '/api/users/{id}',
      },
    })

    await triggerExecute(wrapper)

    expect(mockToast).not.toHaveBeenCalled()
    expect(requestFactory).toHaveBeenCalledOnce()
    expect(sendRequest).toHaveBeenCalledOnce()
  })

  it('displays toast error when buildRequest returns a failure result', async () => {
    vi.mocked(buildRequest).mockReturnValue(
      err(
        'MISSING_REQUEST_SERVER_BASE',
        'No server URL is configured for this request. Add a servers entry to your OpenAPI document (or set a server in the client) before sending.',
      ),
    )

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(mockToast).toHaveBeenCalledWith(
      'No server URL is configured for this request. Add a servers entry to your OpenAPI document (or set a server in the client) before sending.',
      'error',
    )
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('passes allowMissingRequestServerBase true when layout is modal', async () => {
    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), layout: 'modal' },
    })

    await triggerExecute(wrapper)

    expect(buildRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        envVariables: {},
        allowMissingRequestServerBase: true,
      }),
    )
  })

  it('displays toast error when buildRequest returns BUILD_REQUEST_FAILED', async () => {
    vi.mocked(buildRequest).mockReturnValue(err('BUILD_REQUEST_FAILED' as const, 'Invalid URL'))

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(mockToast).toHaveBeenCalledWith('Invalid URL', 'error')
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it('persists a pre-request script variable when the request never builds', async () => {
    const mockEventBus = createMockEventBus()

    // The request fails to build, so the flow bails out before sending.
    vi.mocked(buildRequest).mockReturnValue(err('BUILD_REQUEST_FAILED' as const, 'Invalid URL'))

    // A pre-request script stores a token in the active environment.
    const setTokenPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: ({ variablesStore }) => {
          variablesStore?.setEnvironment?.([{ key: 'token', value: 'from-script' }])
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        plugins: [setTokenPlugin],
        activeEnvironment: 'default',
      },
    })

    await triggerExecute(wrapper)

    expect(sendRequest).not.toHaveBeenCalled()
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'environment:upsert:environment-variable',
      expect.objectContaining({
        environmentName: 'default',
        variable: { name: 'token', value: 'from-script' },
        collectionType: 'workspace',
      }),
    )
  })

  it('displays toast error when sendRequest fails', async () => {
    const mockController = new AbortController()

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    const mockError = new Error(ERRORS.REQUEST_FAILED)
    vi.mocked(sendRequest).mockResolvedValue([mockError, null])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(mockToast).toHaveBeenCalledWith(ERRORS.REQUEST_FAILED, 'error')
    const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
    expect(responseBlock.props('requestError')).toBe(mockError)

    await wrapper.setProps({ path: '/other' })
    expect(responseBlock.props('requestError')).toBe(null)
  })

  it('clears failure feedback when retrying and does not retain cancellation as a failure', async () => {
    const controller = new AbortController()
    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )
    vi.mocked(sendRequest).mockResolvedValueOnce([new TypeError('Failed to fetch'), null])
    const wrapper = mount(OperationBlock, { props: createDefaultProps() })
    await triggerExecute(wrapper)
    const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
    expect(responseBlock.props('requestError').message).toBe('Failed to fetch')

    vi.mocked(sendRequest).mockImplementationOnce(() => {
      expect(responseBlock.props('requestError')).toBe(null)
      controller.abort(ERRORS.REQUEST_ABORTED)
      return Promise.resolve([new Error(ERRORS.REQUEST_ABORTED), null])
    })
    await triggerExecute(wrapper)
    expect(responseBlock.props('requestError')).toBe(null)
    wrapper.unmount()
  })

  it('persists a pre-request script variable even when the request fails', async () => {
    const mockEventBus = createMockEventBus()

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: new AbortController(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    // The request fails, so persistence must run outside the success branch.
    vi.mocked(sendRequest).mockResolvedValue([new Error(ERRORS.REQUEST_FAILED), null])

    // A pre-request script stores a token in the active environment.
    const setTokenPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: ({ variablesStore }) => {
          variablesStore?.setEnvironment?.([{ key: 'token', value: 'from-script' }])
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        plugins: [setTokenPlugin],
        activeEnvironment: 'default',
      },
    })

    await triggerExecute(wrapper)

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'environment:upsert:environment-variable',
      expect.objectContaining({
        environmentName: 'default',
        variable: { name: 'token', value: 'from-script' },
        collectionType: 'workspace',
      }),
    )
  })

  it('persists script writes to the environment active when the request started, not one switched to mid-flight', async () => {
    const mockEventBus = createMockEventBus()

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: new AbortController(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    // Hold the request open so the active environment can change before persistence runs.
    let resolveSend!: (value: Awaited<ReturnType<typeof sendRequest>>) => void
    vi.mocked(sendRequest).mockReturnValue(
      new Promise<Awaited<ReturnType<typeof sendRequest>>>((resolve) => {
        resolveSend = resolve
      }),
    )

    const setTokenPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: ({ variablesStore }) => {
          variablesStore?.setEnvironment?.([{ key: 'token', value: 'from-script' }])
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        plugins: [setTokenPlugin],
        activeEnvironment: 'default',
      },
    })

    // Start the request; it suspends at the pending sendRequest.
    wrapper.findComponent({ name: 'Header' }).vm.$emit('execute')
    await flushPromises()

    // The user switches environments while the request is in flight.
    await wrapper.setProps({ activeEnvironment: 'switched' })

    // Complete the request so persistence runs.
    resolveSend([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])
    await flushPromises()

    // The write lands on the environment that was active when the request began.
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'environment:upsert:environment-variable',
      expect.objectContaining({
        environmentName: 'default',
        variable: { name: 'token', value: 'from-script' },
      }),
    )
    expect(mockEventBus.emit).not.toHaveBeenCalledWith(
      'environment:upsert:environment-variable',
      expect.objectContaining({ environmentName: 'switched' }),
    )
  })

  it('resolves persistence indexes against a seed-time copy when the environment array is spliced mid-flight', async () => {
    const mockEventBus = createMockEventBus()
    // token sits at index 0 in the workspace scope when the request starts.
    const environment: XScalarEnvironment = { color: 'blue', variables: [{ name: 'token', value: 'old' }] }

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: new AbortController(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    // Hold the request open so the environment array can be spliced before persistence runs.
    let resolveSend!: (value: Awaited<ReturnType<typeof sendRequest>>) => void
    vi.mocked(sendRequest).mockReturnValue(
      new Promise<Awaited<ReturnType<typeof sendRequest>>>((resolve) => {
        resolveSend = resolve
      }),
    )

    const setTokenPlugin: ClientPlugin = {
      hooks: {
        beforeRequest: ({ variablesStore }) => {
          variablesStore?.setEnvironment?.([{ key: 'token', value: 'new' }])
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus: mockEventBus,
        plugins: [setTokenPlugin],
        activeEnvironment: 'default',
        environment,
      },
    })

    wrapper.findComponent({ name: 'Header' }).vm.$emit('execute')
    await flushPromises()

    // A concurrent change prepends a variable, shifting token to index 1 in the live array.
    environment.variables.unshift({ name: 'other', value: 'x' })

    resolveSend([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])
    await flushPromises()

    // token must still resolve to its seed-time index (0), not the shifted one.
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'environment:upsert:environment-variable',
      expect.objectContaining({
        environmentName: 'default',
        variable: { name: 'token', value: 'new' },
        index: 0,
        collectionType: 'workspace',
      }),
    )
  })

  it('cancels request when cancelRequest is invoked via event bus', async () => {
    const mockEventBus = createMockEventBus()
    const mockController = new AbortController()
    const abortSpy = vi.spyOn(mockController, 'abort')

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
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

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
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
        proxyUrl: 'https://proxy.example.com',
      }),
      {
        envVariables: {},
        allowMissingRequestServerBase: false,
      },
    )
  })

  it('passes isUsingProxy from request factory to sendRequest', async () => {
    const mockController = new AbortController()

    vi.mocked(requestFactory).mockReturnValue({
      request: createDefaultRequestFactoryPayload({
        proxyUrl: 'https://proxy.example.com',
      }),
    })

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: [
          'https://proxy.example.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fapi%2Fusers',
          { method: 'GET', headers: new Headers() },
        ],
        isUsingProxy: true,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: [
          'https://proxy.example.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fapi%2Fusers',
          { method: 'GET', headers: new Headers() },
        ],
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
      requestPayload: [expect.any(String), expect.any(Object)],
      request: expect.any(Request),
      plugins: [],
      customFetch: undefined,
      onResponseReceived: expect.any(Function),
    })
  })

  it('passes the exact Request observed by the requestBuilt hook to sendRequest', async () => {
    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    const requestBuiltCall = vi.mocked(executeHook).mock.calls.find((call) => call[1] === 'requestBuilt')
    expect(requestBuiltCall).toBeDefined()

    const hookRequest = (requestBuiltCall?.[0] as { request: Request } | undefined)?.request
    expect(hookRequest).toBeInstanceOf(Request)

    // The hook and the fetch call must observe the same Request instance, so header
    // mutations apply and body hashes match what goes over the wire
    const sendRequestCall = vi.mocked(sendRequest).mock.calls.at(-1)?.[0]
    expect(sendRequestCall?.request).toBe(hookRequest)
  })

  it('multipart body hash computed in the requestBuilt hook matches the request that is sent', async () => {
    const sha256Base64 = async (request: Request): Promise<string> => {
      const bytes = new Uint8Array(await request.clone().arrayBuffer())
      return createHash('sha256').update(bytes).digest('base64')
    }

    const formData = new FormData()
    formData.append('field', 'value')

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: new AbortController(),
        requestPayload: ['https://api.example.com/upload', { method: 'POST', body: formData }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/upload', { method: 'POST' }],
        response: {} as ResponseInstance,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    let hookHash: string | undefined
    const signingPlugin: ClientPlugin = {
      hooks: {
        requestBuilt: async ({ request }) => {
          hookHash = await sha256Base64(request)
        },
      },
    }

    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), plugins: [signingPlugin] },
    })

    await triggerExecute(wrapper)

    expect(hookHash).toBeDefined()

    const sentRequest = vi.mocked(sendRequest).mock.calls.at(-1)?.[0].request
    expect(sentRequest).toBeInstanceOf(Request)
    expect(await sha256Base64(sentRequest as Request)).toBe(hookHash)

    // Guards the regression this feature fixes: rebuilding from the same FormData
    // generates a fresh random multipart boundary, so a rebuilt request hashes differently
    const rebuiltRequest = buildSafeBodyRequest('https://api.example.com/upload', { method: 'POST', body: formData })
    expect(await sha256Base64(rebuiltRequest)).not.toBe(hookHash)
  })

  it.each([200, 600])(
    'renders an open status %s stream while saving history and supports cancellation',
    async (status) => {
      const actual = await vi.importActual<typeof import('./helpers/send-request')>('./helpers/send-request')
      vi.mocked(sendRequest).mockImplementationOnce(actual.sendRequest)
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'streaming',
        document: {
          openapi: '3.1.0',
          info: { title: 'Streaming', version: '1.0.0' },
          paths: { '/api/users': { get: { responses: {} } } },
        },
      })
      const document = store.workspace.documents.streaming
      if (!isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      const eventBus = createWorkspaceEventBus()
      const saveHistory = vi.fn(generateClientMutators(store).doc('streaming').operation.addResponseToHistory)
      eventBus.on('hooks:on:request:complete', saveHistory)
      const controllers: ReadableStreamDefaultController<Uint8Array>[] = []
      const cancel = vi.fn()
      const stream = new ReadableStream<Uint8Array>({
        start: (controller) => {
          controllers.push(controller)
        },
        cancel,
      })
      const networkResponse = new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
      Object.defineProperty(networkResponse, 'status', { value: status })
      const wrapper = mount(OperationBlock, {
        props: {
          ...createDefaultProps(),
          document,
          eventBus,
          options: { customFetch: () => Promise.resolve(networkResponse) },
        },
        global: { stubs: { ResponseBlock } },
      })

      try {
        await triggerExecute(wrapper)
        // History must finish while the source stream is still open and has sent no chunks.
        expect(saveHistory).toHaveBeenCalledOnce()
        await saveHistory.mock.results[0]!.value
        const history = store.history.getHistory('streaming', '/api/users', 'get')
        expect(history?.length).toBe(1)
        expect(history?.[0]?.response.status).toBe(status)
        expect(history?.[0]?.response.content.text).toBe('')
        expect(cancel).not.toHaveBeenCalled()

        const viewer = wrapper.findComponent(ResponseBodyStreaming)
        expect(viewer.exists()).toBe(true)
        controllers[0]!.enqueue(new TextEncoder().encode('data: first\n\n'))
        await flushPromises()
        expect(viewer.text()).toContain('data: first')
        expect(viewer.text()).toContain('Listening')
        controllers[0]!.enqueue(new TextEncoder().encode('data: second\n\n'))
        await flushPromises()
        expect(viewer.text()).toContain('data: second')

        const cancelButton = viewer.findAll('button').find((button) => button.text() === 'Cancel')
        if (!cancelButton) {
          throw new Error('Expected a stream cancellation button')
        }
        await cancelButton.trigger('click')
        await flushPromises()
        expect(cancel).toHaveBeenCalledOnce()
        expect(stream.locked).toBe(false)
        expect(viewer.text()).not.toContain('Listening')
        expect(viewer.text()).toContain('data: first')
        expect(viewer.text()).toContain('data: second')
      } finally {
        wrapper.unmount()
        eventBus.off('hooks:on:request:complete', saveHistory)
        if (!stream.locked) {
          await stream.cancel()
        }
      }
    },
  )

  it('renders the intercepted response and persists tokens saved by response hooks', async () => {
    const actual = await vi.importActual<typeof import('./helpers/send-request')>('./helpers/send-request')
    vi.mocked(sendRequest).mockImplementationOnce(actual.sendRequest)
    const durations: (number | undefined)[] = []
    const eventBus = createMockEventBus()
    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        eventBus,
        activeEnvironment: 'default',
        options: { customFetch: () => Promise.resolve(Response.json({ token: 'saved' })) },
        plugins: [
          {
            hooks: {
              responseReceived: async ({ response, responseDuration, variablesStore }) => {
                durations.push(responseDuration)
                const data = await response.json()
                variablesStore?.setEnvironment?.([{ key: 'token', value: data.token }])
                return Response.json({ loggedIn: true }, { status: 201 })
              },
            },
          },
        ],
      },
    })

    await triggerExecute(wrapper)

    const { response } = getResponseBlockProps(wrapper)
    expect(durations).toStrictEqual([response?.duration])
    expect(typeof durations[0]).toBe('number')
    expect(response?.status).toBe(201)
    expect(response && 'data' in response ? response.data : undefined).toBe('{"loggedIn":true}')
    expect(eventBus.emit).toHaveBeenCalledWith('environment:upsert:environment-variable', {
      environmentName: 'default',
      variable: { name: 'token', value: 'saved' },
      index: undefined,
      collectionType: 'workspace',
    })
  })

  it('stores response after successful request execution', async () => {
    const mockController = new AbortController()

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

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
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
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

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).not.toBeNull()

    await wrapper.setProps({ path: '/api/posts' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).toBeNull()
  })

  it('clears response and request when method changes', async () => {
    const mockController = new AbortController()
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

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).not.toBeNull()

    await wrapper.setProps({ method: 'post' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).toBeNull()
  })

  it('clears response and request when exampleKey changes', async () => {
    const mockController = new AbortController()
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

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: mockResponse,
        originalResponse: createMockOriginalResponse(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: createDefaultProps(),
    })

    await triggerExecute(wrapper)

    expect(getResponseBlockProps(wrapper).response).not.toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).not.toBeNull()

    await wrapper.setProps({ exampleKey: 'alternative-example' })
    await wrapper.vm.$nextTick()

    expect(getResponseBlockProps(wrapper).response).toBeNull()
    expect(getResponseBlockProps(wrapper).requestPayload).toBeNull()
  })

  it('restores response from cache when navigating back to same operation', async () => {
    const mockController = new AbortController()
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

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: mockController,
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )

    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
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
    expect(getResponseBlockProps(wrapper).requestPayload).not.toBeNull()
  })

  it('only falls back to history entries that were created for the active example', async () => {
    // Two history entries on the same path/method but for different
    // example keys. The active example is `default`, so the response panel
    // must show the `default` entry — not the most recent overall.
    const buildEntry = (exampleKey: string, body: string, status: number) => ({
      time: 100,
      timestamp: Date.now(),
      request: {
        method: 'GET',
        url: 'https://api.example.com/api/users',
        httpVersion: 'HTTP/1.1',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: body.length, mimeType: 'application/json', text: body },
        redirectURL: '',
        headersSize: -1,
        bodySize: body.length,
      },
      meta: { example: exampleKey },
      requestMetadata: { variables: {} },
    })

    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        // Chronological order: `default` first, then `alternative` newer.
        history: [
          buildEntry('default', '{"from":"default"}', 200),
          buildEntry('alternative', '{"from":"alternative"}', 201),
        ],
      },
    })

    await wrapper.vm.$nextTick()

    const restored = getResponseBlockProps(wrapper).response
    expect(restored?.status).toBe(200)
    expect(restored && 'data' in restored ? restored.data : undefined).toBe('{"from":"default"}')
  })

  it('restores history after a failed request on the same draft example', async () => {
    // Simulates landing on an operation that has been called before in a
    // previous session: `responseCache` is empty but the workspace store
    // still holds the operation's history. The response panel should show
    // the most recent historical response instead of an empty state.
    const historyEntry = {
      time: 250,
      timestamp: Date.now(),
      request: {
        method: 'GET',
        url: 'https://api.example.com/api/users',
        httpVersion: 'HTTP/1.1',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 201,
        statusText: 'Created',
        httpVersion: 'HTTP/1.1',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        cookies: [],
        content: {
          size: 19,
          mimeType: 'application/json',
          text: '{"from":"history"}',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: 19,
      },
      meta: { example: 'draft' },
      requestMetadata: { variables: {} },
    }

    const eventBus = createWorkspaceEventBus()
    eventBus.on('operation:reload:history', ({ callback }) => callback('success'))
    eventBus.on('ui:navigate', ({ callback }) => callback?.('success'))
    const wrapper = mount(OperationBlock, {
      props: {
        ...createDefaultProps(),
        history: [historyEntry],
        exampleKey: 'draft',
        eventBus,
      },
    })

    await wrapper.vm.$nextTick()

    const restored = getResponseBlockProps(wrapper).response
    expect(restored).not.toBeNull()
    expect(restored?.status).toBe(201)
    expect(restored && 'data' in restored ? restored.data : undefined).toBe('{"from":"history"}')

    vi.mocked(sendRequest).mockResolvedValueOnce([new TypeError('Failed to fetch'), null])
    await triggerExecute(wrapper)
    const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
    expect(responseBlock.props('requestError').message).toBe('Failed to fetch')

    wrapper.findComponent({ name: 'Header' }).vm.$emit('select:history:item', { index: 0 })
    await flushPromises()
    expect(responseBlock.props('requestError')).toBe(null)
    expect(responseBlock.props('response').data).toBe('{"from":"history"}')
    wrapper.unmount()
  })

  it('prefers the in-memory cache over history when both are available', async () => {
    // After a fresh send, `responseCache` holds the live response (with
    // streams, full body, etc.). The history fallback should only kick in
    // when the cache misses — it must not overwrite a cache hit.
    const liveResponse: ResponseInstance = {
      status: 200,
      statusText: 'OK',
      headers: {},
      cookieHeaderKeys: [],
      duration: 100,
      method: 'get',
      path: '/api/users',
      data: '{"from":"cache"}',
      size: 16,
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

    const historyEntry = {
      time: 250,
      timestamp: Date.now(),
      request: {
        method: 'GET',
        url: 'https://api.example.com/api/users',
        httpVersion: 'HTTP/1.1',
        headers: [],
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: -1,
      },
      response: {
        status: 201,
        statusText: 'Created',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: { size: 19, mimeType: 'application/json', text: '{"from":"history"}' },
        redirectURL: '',
        headersSize: -1,
        bodySize: 19,
      },
      meta: { example: 'default' },
      requestMetadata: { variables: {} },
    }

    vi.mocked(buildRequest).mockReturnValue(
      ok({
        controller: new AbortController(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        isUsingProxy: false,
      }),
    )
    vi.mocked(sendRequest).mockResolvedValue([
      null,
      {
        timestamp: Date.now(),
        requestPayload: ['https://api.example.com/api/users', { method: 'GET', headers: new Headers() }],
        response: liveResponse,
        originalResponse: new Response(),
      },
    ])

    const wrapper = mount(OperationBlock, {
      props: { ...createDefaultProps(), history: [historyEntry] },
    })

    // Send a request so the cache is populated with the live response.
    await triggerExecute(wrapper)
    // Navigate away and back — the cache should win over history.
    await wrapper.setProps({ path: '/api/posts' })
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ path: '/api/users' })
    await wrapper.vm.$nextTick()

    const restored = getResponseBlockProps(wrapper).response
    expect(restored && 'data' in restored ? restored.data : undefined).toBe('{"from":"cache"}')
  })
})
