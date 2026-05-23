import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WEBSOCKET_CONNECTION_FAILED, WEBSOCKET_CONNECTION_FAILED_MESSAGE, connectWebSocket } from './connect-websocket'
import { createWebSocketSession } from './websocket-session'

type MockSocketInstance = {
  binaryType: string
  onopen: ((ev: Event) => void) | null
  onmessage: ((ev: MessageEvent) => void) | null
  onerror: ((ev: Event) => void) | null
  onclose: ((ev: CloseEvent) => void) | null
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

const createMockWebSocket = () => {
  let instance: MockSocketInstance | null = null
  const constructorCalls: Array<{ url: string; protocols?: string | string[] }> = []
  let onInstanceCreated: (() => void) | null = null

  function MockWS(this: MockSocketInstance, url: string, protocols?: string | string[]) {
    constructorCalls.push({ url, protocols })
    this.binaryType = 'blob'
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null
    this.send = vi.fn()
    this.close = vi.fn()
    instance = this
    onInstanceCreated?.()
  }

  const waitForInstance = (): Promise<MockSocketInstance> =>
    new Promise((resolve) => {
      if (instance) {
        resolve(instance)
        return
      }
      onInstanceCreated = () => {
        resolve(instance!)
        onInstanceCreated = null
      }
    })

  return {
    MockWS: MockWS as unknown as typeof WebSocket,
    get instance() {
      return instance
    },
    get constructorCalls() {
      return constructorCalls
    },
    waitForInstance,
    reset: () => {
      instance = null
      constructorCalls.length = 0
      onInstanceCreated = null
    },
  }
}

describe('connectWebSocket', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with session on successful connection', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))

    const result = await promise

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.session).toBe(session)
    }
    expect(session.state).toBe('open')
  })

  it('returns failure when connection fails before opening', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onerror?.(new Event('error'))
    ws.onclose?.(new CloseEvent('close', { code: 1006, reason: '', wasClean: false }))

    const result = await promise

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(WEBSOCKET_CONNECTION_FAILED)
      expect(result.message).toBe(WEBSOCKET_CONNECTION_FAILED_MESSAGE)
    }
  })

  it('invokes beforeConnect plugin hook and uses modified URL', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const plugin: ClientPlugin = {
      webSocketHooks: {
        beforeConnect: async ({ url }) => `${url}?token=abc`,
      },
    }

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      plugins: [plugin],
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    const result = await promise

    expect(result.ok).toBe(true)
    expect(mock.constructorCalls[0]!.url).toBe('wss://example.com?token=abc')
  })

  it('invokes onWebSocketMessage plugin hook for incoming frames', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()
    const messageHook = vi.fn()

    const plugin: ClientPlugin = {
      webSocketHooks: {
        onWebSocketMessage: messageHook,
      },
    }

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      plugins: [plugin],
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    await promise

    ws.onmessage?.(new MessageEvent('message', { data: '{"msg":"hi"}' }))

    expect(messageHook).toHaveBeenCalledTimes(1)
    expect(messageHook).toHaveBeenCalledWith(
      expect.objectContaining({
        frame: expect.objectContaining({
          direction: 'incoming',
          data: '{"msg":"hi"}',
        }),
      }),
    )
  })

  it('invokes onWebSocketClose plugin hook when connection closes', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()
    const closeHook = vi.fn()

    const plugin: ClientPlugin = {
      webSocketHooks: {
        onWebSocketClose: closeHook,
      },
    }

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      plugins: [plugin],
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    await promise

    ws.onclose?.(new CloseEvent('close', { code: 1000, reason: 'done', wasClean: true }))

    expect(closeHook).toHaveBeenCalledWith(
      expect.objectContaining({
        info: { code: 1000, reason: 'done', wasClean: true },
      }),
    )
  })

  it('calls user callbacks alongside plugin hooks', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()
    const onFrame = vi.fn()
    const onOpen = vi.fn()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      customWebSocket: mock.MockWS,
      callbacks: { onFrame, onOpen },
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    await promise

    expect(onOpen).toHaveBeenCalledTimes(1)

    ws.onmessage?.(new MessageEvent('message', { data: 'test' }))
    expect(onFrame).toHaveBeenCalledTimes(1)
  })

  it('chains multiple beforeConnect hooks', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const plugin1: ClientPlugin = {
      webSocketHooks: {
        beforeConnect: async ({ url }) => `${url}?a=1`,
      },
    }
    const plugin2: ClientPlugin = {
      webSocketHooks: {
        beforeConnect: async ({ url }) => `${url}&b=2`,
      },
    }

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      plugins: [plugin1, plugin2],
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    await promise

    expect(mock.constructorCalls[0]!.url).toBe('wss://example.com?a=1&b=2')
  })

  it('returns failure when WebSocket constructor throws', async () => {
    function ThrowingWS() {
      throw new Error('Invalid URL')
    }

    const session = createWebSocketSession()

    const result = await connectWebSocket({
      connectionUrl: 'invalid',
      session,
      customWebSocket: ThrowingWS as unknown as typeof WebSocket,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(WEBSOCKET_CONNECTION_FAILED)
    }
  })

  it('passes protocols to the session', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      protocols: ['graphql-ws'],
      session,
      customWebSocket: mock.MockWS,
    })

    const ws = await mock.waitForInstance()
    ws.onopen?.(new Event('open'))
    await promise

    expect(mock.constructorCalls[0]).toEqual({ url: 'wss://example.com', protocols: ['graphql-ws'] })
  })

  it('returns failure when the session is destroyed while connecting', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      customWebSocket: mock.MockWS,
    })

    await mock.waitForInstance()
    session.destroy()

    const result = await promise

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(WEBSOCKET_CONNECTION_FAILED)
    }
  })

  it('returns failure when session.connect replaces an in-flight connection', async () => {
    const mock = createMockWebSocket()
    const session = createWebSocketSession()

    const promise = connectWebSocket({
      connectionUrl: 'wss://example.com',
      session,
      customWebSocket: mock.MockWS,
    })

    await mock.waitForInstance()

    session.connect({
      url: 'wss://example.com/other',
      customWebSocket: mock.MockWS,
    })

    const result = await promise

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(WEBSOCKET_CONNECTION_FAILED)
    }
  })
})
