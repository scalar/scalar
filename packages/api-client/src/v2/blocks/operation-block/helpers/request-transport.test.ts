import type { ClientPlugin, HttpTransport } from '@scalar/oas-utils/helpers'
import { requestFactory } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { describe, expect, it, vi } from 'vitest'

import { createTransportFetch, resolveRequestTransportFetch, resolveTargetProtocol } from './request-transport'

const emptyEnvironment: XScalarEnvironment = {
  color: '#FFFFFF',
  variables: [],
}

type FactoryArgs = Parameters<typeof requestFactory>[0]

const createRequestBuilder = (overrides: Partial<FactoryArgs> = {}) =>
  requestFactory({
    path: '/v1/users',
    method: 'get',
    exampleName: 'default',
    environment: emptyEnvironment,
    globalCookies: [],
    proxyUrl: 'https://proxy.scalar.com',
    server: { url: 'https://api.example.com' },
    defaultHeaders: {},
    isElectron: false,
    selectedSecuritySchemes: [],
    operation: { parameters: [] },
    ...overrides,
  }).request

describe('resolveTargetProtocol', () => {
  it('returns the protocol of an absolute server URL', () => {
    expect(resolveTargetProtocol(createRequestBuilder(), {})).toBe('https')
  })

  it('resolves server URL templates through environment variables', () => {
    const requestBuilder = createRequestBuilder({
      server: { url: '{{scheme}}://api.example.com' },
    })

    expect(resolveTargetProtocol(requestBuilder, { scheme: 'http' })).toBe('http')
  })

  it('ignores the proxy URL and resolves the real target protocol', () => {
    const requestBuilder = createRequestBuilder({
      server: { url: 'http://api.example.com' },
      proxyUrl: 'https://proxy.scalar.com',
    })

    expect(resolveTargetProtocol(requestBuilder, {})).toBe('http')
  })

  it('falls back to the page origin protocol when no server is configured', () => {
    const requestBuilder = createRequestBuilder({ server: null })

    // jsdom serves the test page from http://localhost:3000
    expect(resolveTargetProtocol(requestBuilder, {})).toBe('http')
  })
})

describe('createTransportFetch', () => {
  it('passes a Request through to the transport unchanged', async () => {
    const send = vi.fn(() => new Response('from transport'))
    const transport: HttpTransport = { kind: 'http', send }
    const transportFetch = createTransportFetch(transport, { documentType: 'openapi', protocol: 'https' })

    const request = new Request('https://api.example.com/v1/users')
    const response = await transportFetch(request)

    expect(send).toHaveBeenCalledWith(request, { documentType: 'openapi', protocol: 'https' })
    expect(await response.text()).toBe('from transport')
  })

  it('builds a Request from a raw url and init payload', async () => {
    const send = vi.fn<HttpTransport['send']>(() => new Response('ok'))
    const transport: HttpTransport = { kind: 'http', send }
    const transportFetch = createTransportFetch(transport, { documentType: 'openapi', protocol: 'https' })

    await transportFetch('https://api.example.com/v1/users', { method: 'POST', body: 'payload' })

    const sentRequest = send.mock.calls[0]?.[0]
    expect(sentRequest).toBeInstanceOf(Request)
    expect(sentRequest?.method).toBe('POST')
    expect(await sentRequest?.text()).toBe('payload')
  })

  it('strips the body for methods that cannot have one', async () => {
    const send = vi.fn<HttpTransport['send']>(() => new Response('ok'))
    const transport: HttpTransport = { kind: 'http', send }
    const transportFetch = createTransportFetch(transport, { documentType: 'openapi', protocol: 'https' })

    await transportFetch('https://api.example.com/v1/users', { method: 'GET', body: 'ignored' })

    const sentRequest = send.mock.calls[0]?.[0]
    expect(sentRequest?.body).toBeNull()
  })
})

describe('resolveRequestTransportFetch', () => {
  const createPlugin = (send: HttpTransport['send'], protocols = ['https']): ClientPlugin => ({
    transports: [{ protocols, transport: { kind: 'http', send } }],
  })

  it('returns a fetch wrapping the matching plugin transport', async () => {
    const send = vi.fn(() => new Response('from plugin'))
    const transportFetch = resolveRequestTransportFetch({
      requestBuilder: createRequestBuilder(),
      envVariables: {},
      documentType: 'openapi',
      plugins: [createPlugin(send)],
    })

    expect(transportFetch).toBeDefined()

    const response = await transportFetch!(new Request('https://api.example.com/v1/users'))
    expect(send).toHaveBeenCalledOnce()
    expect(await response.text()).toBe('from plugin')
  })

  it('returns undefined when no plugin matches the protocol', () => {
    const transportFetch = resolveRequestTransportFetch({
      requestBuilder: createRequestBuilder(),
      envVariables: {},
      documentType: 'openapi',
      plugins: [createPlugin(vi.fn(), ['mqtt'])],
    })

    expect(transportFetch).toBeUndefined()
  })

  it('returns undefined when the fallback page-origin protocol does not match', () => {
    const transportFetch = resolveRequestTransportFetch({
      // Without a server the target resolves against the page origin (http in jsdom)
      requestBuilder: createRequestBuilder({ server: null }),
      envVariables: {},
      documentType: 'openapi',
      plugins: [createPlugin(vi.fn(), ['https'])],
    })

    expect(transportFetch).toBeUndefined()
  })
})
