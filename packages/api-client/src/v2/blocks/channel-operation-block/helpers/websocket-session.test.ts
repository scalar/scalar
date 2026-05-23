import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WebSocketSessionState } from './websocket-session'
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
  const sentMessages: string[] = []
  let closedWith: { code?: number; reason?: string } | null = null
  const constructorCalls: Array<{ url: string; protocols?: string | string[] }> = []

  function MockWS(this: MockSocketInstance, url: string, protocols?: string | string[]) {
    constructorCalls.push({ url, protocols })
    this.binaryType = 'blob'
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null
    this.send = vi.fn((data: string) => {
      sentMessages.push(data)
    })
    this.close = vi.fn((code?: number, reason?: string) => {
      closedWith = { code, reason }
    })
    instance = this
  }

  return {
    MockWS: MockWS as unknown as typeof WebSocket,
    get instance() {
      return instance
    },
    get sentMessages() {
      return sentMessages
    },
    get closedWith() {
      return closedWith
    },
    get constructorCalls() {
      return constructorCalls
    },
    reset: () => {
      instance = null
      sentMessages.length = 0
      closedWith = null
      constructorCalls.length = 0
    },
  }
}

describe('createWebSocketSession', () => {
  let mock: ReturnType<typeof createMockWebSocket>

  beforeEach(() => {
    mock = createMockWebSocket()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in idle state', () => {
    const session = createWebSocketSession()
    expect(session.state).toBe('idle')
    expect(session.frames).toEqual([])
    expect(session.closeInfo).toBeNull()
    expect(session.url).toBeNull()
  })

  it('transitions to connecting then open', () => {
    const session = createWebSocketSession()
    const stateChanges: Array<{ state: WebSocketSessionState; previous: WebSocketSessionState }> = []

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: {
        onStateChange: (state, previous) => {
          stateChanges.push({ state, previous })
        },
      },
    })

    expect(session.state).toBe('connecting')
    expect(stateChanges).toEqual([{ state: 'connecting', previous: 'idle' }])

    mock.instance!.onopen?.(new Event('open'))

    expect(session.state).toBe('open')
    expect(stateChanges).toEqual([
      { state: 'connecting', previous: 'idle' },
      { state: 'open', previous: 'connecting' },
    ])
  })

  it('stores the connection URL', () => {
    const session = createWebSocketSession()
    session.connect({
      url: 'wss://example.com/chat',
      customWebSocket: mock.MockWS,
    })

    expect(session.url).toBe('wss://example.com/chat')
  })

  it('passes protocols to the WebSocket constructor', () => {
    const session = createWebSocketSession()
    session.connect({
      url: 'wss://example.com',
      protocols: ['graphql-ws'],
      customWebSocket: mock.MockWS,
    })

    expect(mock.constructorCalls[0]).toEqual({ url: 'wss://example.com', protocols: ['graphql-ws'] })
  })

  it('accumulates incoming frames', () => {
    const session = createWebSocketSession()
    const receivedFrames: unknown[] = []

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: {
        onFrame: (frame) => receivedFrames.push(frame),
      },
    })

    mock.instance!.onopen?.(new Event('open'))
    mock.instance!.onmessage?.(new MessageEvent('message', { data: '{"hello":"world"}' }))

    expect(session.frames).toHaveLength(1)
    expect(session.frames[0]).toMatchObject({
      direction: 'incoming',
      data: '{"hello":"world"}',
      opcode: 'text',
    })
    expect(session.frames[0]!.timestamp).toBeGreaterThan(0)
    expect(receivedFrames).toHaveLength(1)
  })

  it('classifies ArrayBuffer messages as binary', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    mock.instance!.onopen?.(new Event('open'))
    mock.instance!.onmessage?.(new MessageEvent('message', { data: new ArrayBuffer(4) }))

    expect(session.frames[0]!.opcode).toBe('binary')
  })

  it('sends data and records outgoing frame', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    mock.instance!.onopen?.(new Event('open'))
    session.send('{"type":"subscribe"}')

    expect(mock.sentMessages).toEqual(['{"type":"subscribe"}'])
    expect(session.frames).toHaveLength(1)
    expect(session.frames[0]).toMatchObject({
      direction: 'outgoing',
      data: '{"type":"subscribe"}',
      opcode: 'text',
    })
  })

  it('ignores send when not in open state', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    session.send('should be ignored')

    expect(session.state).toBe('connecting')
    expect(mock.sentMessages).toEqual([])
    expect(session.frames).toHaveLength(0)
  })

  it('transitions through closing to closed on close()', () => {
    const session = createWebSocketSession()
    const stateChanges: WebSocketSessionState[] = []

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: {
        onStateChange: (state) => stateChanges.push(state),
      },
    })

    mock.instance!.onopen?.(new Event('open'))
    session.close(1000, 'done')

    expect(session.state).toBe('closing')
    expect(mock.closedWith).toEqual({ code: 1000, reason: 'done' })

    mock.instance!.onclose?.(new CloseEvent('close', { code: 1000, reason: 'done', wasClean: true }))

    expect(session.state).toBe('closed')
    expect(session.closeInfo).toEqual({ code: 1000, reason: 'done', wasClean: true })
    expect(stateChanges).toEqual(['connecting', 'open', 'closing', 'closed'])
  })

  it('calls onClose callback with close info', () => {
    const session = createWebSocketSession()
    const closeCallback = vi.fn()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: { onClose: closeCallback },
    })

    mock.instance!.onopen?.(new Event('open'))
    session.close()

    mock.instance!.onclose?.(new CloseEvent('close', { code: 1000, reason: '', wasClean: true }))

    expect(closeCallback).toHaveBeenCalledWith({ code: 1000, reason: '', wasClean: true })
  })

  it('transitions to error on socket error', () => {
    const session = createWebSocketSession()
    const errorCallback = vi.fn()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: { onError: errorCallback },
    })

    mock.instance!.onerror?.(new Event('error'))

    expect(session.state).toBe('error')
    expect(errorCallback).toHaveBeenCalledTimes(1)
  })

  it('transitions to error when constructor throws', () => {
    const session = createWebSocketSession()

    function ThrowingWS() {
      throw new Error('Invalid URL')
    }

    session.connect({
      url: 'not-a-url',
      customWebSocket: ThrowingWS as unknown as typeof WebSocket,
    })

    expect(session.state).toBe('error')
  })

  it('resets frames on reconnect', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    const firstInstance = mock.instance!
    firstInstance.onopen?.(new Event('open'))
    firstInstance.onmessage?.(new MessageEvent('message', { data: 'old message' }))
    expect(session.frames).toHaveLength(1)

    session.connect({
      url: 'wss://example.com/v2',
      customWebSocket: mock.MockWS,
    })

    expect(firstInstance.close).toHaveBeenCalledWith(1000, '')
    expect(session.frames).toHaveLength(0)
    expect(session.url).toBe('wss://example.com/v2')
  })

  it('closes an in-progress connection when reconnecting', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    const firstInstance = mock.instance!
    expect(session.state).toBe('connecting')

    session.connect({
      url: 'wss://example.com/v2',
      customWebSocket: mock.MockWS,
    })

    expect(firstInstance.close).toHaveBeenCalledWith(1000, '')
  })

  it('calls onOpen callback', () => {
    const session = createWebSocketSession()
    const openCallback = vi.fn()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: { onOpen: openCallback },
    })

    mock.instance!.onopen?.(new Event('open'))

    expect(openCallback).toHaveBeenCalledTimes(1)
  })

  it('sets binaryType to arraybuffer', () => {
    const session = createWebSocketSession()
    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    expect(mock.instance!.binaryType).toBe('arraybuffer')
  })

  it('destroy() closes an open connection and cleans up', () => {
    const session = createWebSocketSession()
    const stateChanges: WebSocketSessionState[] = []

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: {
        onStateChange: (state) => stateChanges.push(state),
      },
    })

    mock.instance!.onopen?.(new Event('open'))
    session.destroy()

    expect(session.state).toBe('closed')
    expect(mock.closedWith).toEqual({ code: 1000, reason: '' })
  })

  it('destroy() invokes onClose while connecting', () => {
    const session = createWebSocketSession()
    const closeCallback = vi.fn()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: { onClose: closeCallback },
    })

    session.destroy()

    expect(closeCallback).toHaveBeenCalledWith({ code: 1000, reason: '', wasClean: false })
    expect(session.state).toBe('closed')
  })

  it('notifies previous callbacks when reconnecting during connecting', () => {
    const session = createWebSocketSession()
    const firstClose = vi.fn()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
      callbacks: { onClose: firstClose },
    })

    session.connect({
      url: 'wss://example.com/v2',
      customWebSocket: mock.MockWS,
    })

    expect(firstClose).toHaveBeenCalledWith({ code: 1000, reason: '', wasClean: false })
  })

  it('uses default close code 1000 when close() is called without arguments', () => {
    const session = createWebSocketSession()

    session.connect({
      url: 'wss://example.com',
      customWebSocket: mock.MockWS,
    })

    mock.instance!.onopen?.(new Event('open'))
    session.close()

    expect(mock.closedWith).toEqual({ code: 1000, reason: '' })
  })
})
