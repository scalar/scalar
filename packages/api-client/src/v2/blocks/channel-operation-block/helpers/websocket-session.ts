/**
 * WebSocket session abstraction for the AsyncAPI channel operation transport.
 *
 * Manages the lifecycle of a single WebSocket connection: connect, send, close.
 * The session tracks connection state transitions and bidirectional message frames,
 * emitting callbacks so the UI can render a live message log.
 *
 * Browser WebSocket does not support custom headers on the handshake request.
 * Auth is applied via query parameters or Sec-WebSocket-Protocol where applicable.
 * In Electron, a richer handshake path may be used in the future.
 */

export type WebSocketSessionState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'error'

export type WebSocketFrameOpcode = 'text' | 'binary' | 'close'

export type WebSocketFrame = {
  direction: 'incoming' | 'outgoing'
  timestamp: number
  data: string | ArrayBuffer
  opcode: WebSocketFrameOpcode
}

export type WebSocketCloseInfo = {
  code: number
  reason: string
  wasClean: boolean
}

export type WebSocketSessionCallbacks = {
  onFrame?: (frame: WebSocketFrame) => void
  onStateChange?: (state: WebSocketSessionState, previous: WebSocketSessionState) => void
  onError?: (event: Event) => void
  onClose?: (info: WebSocketCloseInfo) => void
  onOpen?: () => void
}

export type WebSocketConnectOptions = {
  url: string
  protocols?: string | string[]
  callbacks?: WebSocketSessionCallbacks
  /** Injectable WebSocket constructor for testing or Electron override */
  customWebSocket?: typeof WebSocket
}

export type WebSocketSession = {
  readonly state: WebSocketSessionState
  readonly frames: WebSocketFrame[]
  readonly closeInfo: WebSocketCloseInfo | null
  readonly url: string | null
  connect: (options: WebSocketConnectOptions) => void
  send: (data: string) => void
  close: (code?: number, reason?: string) => void
  clearFrames: () => void
  destroy: () => void
}

/**
 * Creates a new WebSocket session with lifecycle management.
 *
 * The session starts in `idle` state and transitions through `connecting` -> `open`
 * on success, or `connecting` -> `error` on failure. Calling `close()` transitions
 * through `closing` -> `closed`. Frames are accumulated in the session for the UI
 * message log.
 */
export const createWebSocketSession = (): WebSocketSession => {
  let currentState: WebSocketSessionState = 'idle'
  let socket: WebSocket | null = null
  let callbacks: WebSocketSessionCallbacks = {}
  const frames: WebSocketFrame[] = []
  let closeInfo: WebSocketCloseInfo | null = null
  let currentUrl: string | null = null

  const setState = (next: WebSocketSessionState): void => {
    const previous = currentState
    if (previous === next) {
      return
    }
    currentState = next
    callbacks.onStateChange?.(next, previous)
  }

  const addFrame = (frame: WebSocketFrame): void => {
    frames.push(frame)
    callbacks.onFrame?.(frame)
  }

  const releaseSocket = (): void => {
    if (!socket) {
      return
    }

    const activeSocket = socket
    socket = null
    activeSocket.onopen = null
    activeSocket.onmessage = null
    activeSocket.onerror = null
    activeSocket.onclose = null
    activeSocket.close(1000, '')
  }

  const isInFlight = (): boolean =>
    currentState === 'connecting' || currentState === 'open' || currentState === 'closing'

  const notifyAborted = (targetCallbacks: WebSocketSessionCallbacks): void => {
    const info: WebSocketCloseInfo = { code: 1000, reason: '', wasClean: false }
    targetCallbacks.onClose?.(info)
  }

  const connect = (options: WebSocketConnectOptions): void => {
    const previousCallbacks = callbacks
    const wasInFlight = isInFlight()

    releaseSocket()

    if (wasInFlight) {
      notifyAborted(previousCallbacks)
    }

    frames.length = 0
    closeInfo = null
    currentUrl = options.url
    callbacks = options.callbacks ?? {}

    setState('connecting')

    const WS = options.customWebSocket ?? globalThis.WebSocket

    try {
      socket = options.protocols ? new WS(options.url, options.protocols) : new WS(options.url)
    } catch (_error) {
      setState('error')
      return
    }

    socket.binaryType = 'arraybuffer'

    socket.onopen = (): void => {
      setState('open')
      callbacks.onOpen?.()
    }

    socket.onmessage = (event: MessageEvent): void => {
      const isArrayBuffer = event.data instanceof ArrayBuffer
      addFrame({
        direction: 'incoming',
        timestamp: Date.now(),
        data: event.data as string | ArrayBuffer,
        opcode: isArrayBuffer ? 'binary' : 'text',
      })
    }

    socket.onerror = (event: Event): void => {
      // Errors after open are advisory; onclose owns terminal state. Transitioning
      // to `error` here would block send() while the socket may still be connected.
      if (currentState === 'connecting') {
        setState('error')
      }
      callbacks.onError?.(event)
    }

    socket.onclose = (event: CloseEvent): void => {
      closeInfo = {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      }
      setState('closed')
      callbacks.onClose?.(closeInfo)
      releaseSocket()
    }
  }

  const send = (data: string): void => {
    if (!socket || currentState !== 'open') {
      return
    }

    socket.send(data)

    addFrame({
      direction: 'outgoing',
      timestamp: Date.now(),
      data,
      opcode: 'text',
    })
  }

  const close = (code?: number, reason?: string): void => {
    if (!socket) {
      return
    }

    if (currentState === 'connecting' || currentState === 'open') {
      setState('closing')
      socket.close(code ?? 1000, reason ?? '')
    }
  }

  const clearFrames = (): void => {
    frames.length = 0
  }

  const destroy = (): void => {
    const wasInFlight = isInFlight()

    releaseSocket()

    if (wasInFlight) {
      closeInfo = { code: 1000, reason: '', wasClean: false }
      callbacks.onClose?.(closeInfo)
    }

    setState('closed')
  }

  return {
    get state() {
      return currentState
    },
    get frames() {
      return frames
    },
    get closeInfo() {
      return closeInfo
    },
    get url() {
      return currentUrl
    },
    connect,
    send,
    close,
    clearFrames,
    destroy,
  }
}
