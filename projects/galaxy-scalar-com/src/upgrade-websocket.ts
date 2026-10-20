import { type UpgradeWebSocket, WSContext, defineWebSocketHelper } from 'hono/ws'

/** Cloudflare exposes accepted sockets through WebSocketPair rather than a listening server. */
declare const WebSocketPair: new () => {
  0: WebSocket
  1: WebSocket & { accept: () => void }
}

/** Accept a Worker socket and notify the mock transport so it can send its initial samples. */
export const upgradeWebSocket: UpgradeWebSocket = defineWebSocketHelper((c, events) => {
  if (c.req.header('Upgrade')?.toLowerCase() !== 'websocket') {
    return
  }

  const { 0: client, 1: server } = new WebSocketPair()
  const ws = new WSContext({
    raw: server,
    url: c.req.url,
    readyState: 1,
    send: (data) => server.send(data),
    close: (code, reason) => server.close(code, reason),
  })

  server.addEventListener('message', (event) => events.onMessage?.(event, ws))
  server.addEventListener('close', (event) => events.onClose?.(event, ws))
  server.addEventListener('error', (event) => events.onError?.(event, ws))
  server.accept()
  // Cloudflare has no open event for accepted sockets. Sending after accept queues the
  // sample for the client, without requiring the client to send a subscription frame.
  events.onOpen?.(new Event('open'), ws)

  const responseInit: ResponseInit & { webSocket: WebSocket } = { status: 101, webSocket: client }
  return new Response(null, responseInit)
})
