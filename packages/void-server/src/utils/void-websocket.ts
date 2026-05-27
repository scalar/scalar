import type { Server as HttpServer, IncomingMessage } from 'node:http'

import type { ServerType } from '@hono/node-server'
import { type WebSocket, WebSocketServer } from 'ws'

/** Default max connection lifetime (60 seconds). */
export const DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS = 60_000

export type VoidWebSocketOptions = {
  /**
   * When set, only accept WebSocket upgrades on this path.
   * By default, any path with a valid WebSocket handshake is accepted.
   */
  path?: string
  /** Max connection lifetime in milliseconds. Defaults to env or {@link DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS}. */
  connectionTimeoutMs?: number
}

/**
 * Returns whether an HTTP upgrade request is a WebSocket handshake.
 */
export const isWebSocketUpgrade = (request: IncomingMessage): boolean => {
  const upgrade = request.headers.upgrade
  if (!upgrade) {
    return false
  }

  return upgrade.toLowerCase() === 'websocket'
}

/**
 * Resolves the WebSocket connection timeout from options or `VOID_WEBSOCKET_TIMEOUT_MS`.
 */
export const getVoidWebSocketTimeoutMs = (overrideMs?: number): number => {
  if (overrideMs !== undefined) {
    return overrideMs
  }

  const fromEnv = Number.parseInt(process.env.VOID_WEBSOCKET_TIMEOUT_MS ?? '', 10)
  if (!Number.isNaN(fromEnv) && fromEnv > 0) {
    return fromEnv
  }

  return DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS
}

/**
 * Creates a WebSocket server that must be attached with {@link attachVoidWebSocketEcho}.
 */
export const createVoidWebSocketServer = (): WebSocketServer => {
  return new WebSocketServer({ noServer: true })
}

const scheduleConnectionTimeout = (ws: WebSocket, connectionTimeoutMs: number): (() => void) => {
  const timeoutId = setTimeout(() => {
    if (ws.readyState === ws.OPEN) {
      ws.close(1000, 'Connection timeout')
    }
  }, connectionTimeoutMs)

  return () => {
    clearTimeout(timeoutId)
  }
}

const bindEchoHandlers = (ws: WebSocket, connectionTimeoutMs: number): void => {
  const clearConnectionTimeout = scheduleConnectionTimeout(ws, connectionTimeoutMs)

  ws.on('message', (data, isBinary) => {
    ws.send(data, { binary: isBinary })
  })

  ws.on('close', () => {
    clearConnectionTimeout()
  })
}

/**
 * Attaches a WebSocket echo handler to an existing Node HTTP server.
 *
 * Any request with `Upgrade: websocket` is accepted on whatever path the client uses.
 * Incoming frames (text or binary) are sent back unchanged. Connections are closed
 * after `connectionTimeoutMs` to avoid holding sockets open indefinitely.
 */
export const attachVoidWebSocketEcho = (
  httpServer: HttpServer | ServerType,
  webSocketServer: WebSocketServer,
  options: VoidWebSocketOptions = {},
): void => {
  const connectionTimeoutMs = getVoidWebSocketTimeoutMs(options.connectionTimeoutMs)

  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    if (!isWebSocketUpgrade(request)) {
      return
    }

    if (options.path !== undefined) {
      const requestPath = request.url?.split('?')[0] ?? ''
      if (requestPath !== options.path) {
        socket.destroy()
        return
      }
    }

    webSocketServer.handleUpgrade(request, socket, head, (ws) => {
      bindEchoHandlers(ws, connectionTimeoutMs)
    })
  })
}
