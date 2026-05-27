import type { Server as HttpServer, IncomingMessage } from 'node:http'

import type { ServerType } from '@hono/node-server'
import { type WebSocket, WebSocketServer } from 'ws'

/** Default WebSocket connection lifetime in milliseconds. */
export const DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS = 60_000

export type VoidWebSocketOptions = {
  /**
   * Restrict accepted upgrades to a specific path.
   *
   * When omitted, any path with a valid WebSocket handshake is accepted, which
   * mirrors the HTTP side of the void server.
   */
  path?: string
  /**
   * Maximum connection lifetime in milliseconds.
   *
   * Falls back to the `VOID_WEBSOCKET_TIMEOUT_MS` env var, then to
   * {@link DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS}. Idle connections are closed to
   * prevent sockets from accumulating in long-running deployments.
   */
  connectionTimeoutMs?: number
}

const isWebSocketUpgrade = (request: IncomingMessage): boolean => {
  return request.headers.upgrade?.toLowerCase() === 'websocket'
}

const resolveConnectionTimeoutMs = (overrideMs?: number): number => {
  if (overrideMs !== undefined) {
    return overrideMs
  }

  const fromEnv = Number.parseInt(process.env.VOID_WEBSOCKET_TIMEOUT_MS ?? '', 10)
  if (!Number.isNaN(fromEnv) && fromEnv > 0) {
    return fromEnv
  }

  return DEFAULT_VOID_WEBSOCKET_TIMEOUT_MS
}

const bindEchoHandlers = (ws: WebSocket, connectionTimeoutMs: number): void => {
  const timeoutId = setTimeout(() => {
    if (ws.readyState === ws.OPEN) {
      ws.close(1000, 'Connection timeout')
    }
  }, connectionTimeoutMs)

  ws.on('message', (data, isBinary) => {
    ws.send(data, { binary: isBinary })
  })

  ws.on('close', () => {
    clearTimeout(timeoutId)
  })
}

/**
 * Attaches a WebSocket echo handler to an existing Node HTTP server.
 *
 * Any request with `Upgrade: websocket` is accepted on whatever path the
 * client uses (unless {@link VoidWebSocketOptions.path} is set). Incoming text
 * and binary frames are echoed back unchanged.
 *
 * @example
 * ```ts
 * import { serve } from '@hono/node-server'
 * import { attachVoidWebSocket, createVoidServer } from '@scalar/void-server'
 *
 * const app = createVoidServer()
 * const httpServer = serve({ fetch: app.fetch, port: 3000 })
 *
 * attachVoidWebSocket(httpServer)
 * ```
 */
export const attachVoidWebSocket = (
  httpServer: HttpServer | ServerType,
  options: VoidWebSocketOptions = {},
): WebSocketServer => {
  const webSocketServer = new WebSocketServer({ noServer: true })
  const connectionTimeoutMs = resolveConnectionTimeoutMs(options.connectionTimeoutMs)

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

  return webSocketServer
}
