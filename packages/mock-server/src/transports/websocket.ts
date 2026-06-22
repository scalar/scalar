import type { MockTransport } from '@/transports/types'

/**
 * Built-in WebSocket transport. Serves channels whose servers speak `ws`/`wss` by upgrading the
 * channel route to a WebSocket connection.
 *
 * - `receive` operations (server push): one message is emitted per operation when a client connects.
 * - `send` operations (client -> server): each inbound frame is logged and echoed with a generated reply.
 */
export const websocketTransport: MockTransport = {
  name: 'websocket',
  supports: (channel) => channel.protocols.includes('ws') || channel.protocols.includes('wss'),
  register: (channel, context) => {
    const { app, upgradeWebSocket, generateMessage, onMessage, log } = context

    const receiveOperations = channel.operations.filter((operation) => operation.action === 'receive')
    const sendOperation = channel.operations.find((operation) => operation.action === 'send')

    app.get(
      channel.route,
      upgradeWebSocket(() => ({
        onOpen: (_event, ws) => {
          log(`[ws] open ${channel.route}`)

          // Push a single message per receive operation on connect (quiet, deterministic default).
          for (const operation of receiveOperations) {
            const message = generateMessage(channel, operation.messages[0]?.id)
            if (message) {
              ws.send(message.data)
              onMessage?.({ channel: channel.id, direction: 'out', payload: message.data })
            }
          }
        },
        onMessage: (event, ws) => {
          const incoming = typeof event.data === 'string' ? event.data : '[binary]'
          log(`[ws] recv ${channel.route}: ${incoming}`)
          onMessage?.({ channel: channel.id, direction: 'in', payload: incoming })

          // Echo a generated reply for the channel's send operation (if any).
          const reply = generateMessage(channel, sendOperation?.messages[0]?.id)
          if (reply) {
            ws.send(reply.data)
            onMessage?.({ channel: channel.id, direction: 'out', payload: reply.data })
          }
        },
        onClose: () => log(`[ws] close ${channel.route}`),
      })),
    )
  },
}
