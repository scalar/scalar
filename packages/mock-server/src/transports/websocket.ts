import type { MockTransport } from '@/transports/types'
import { getAuthenticatedChannel } from '@/utils/authenticate-asyncapi-channel'

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

    app.get(
      channel.route,
      upgradeWebSocket((c) => {
        const authorized = getAuthenticatedChannel(c, channel)
        const receiveOperations = authorized.operations.filter((operation) => operation.action === 'receive')
        const sendOperation = authorized.operations.find((operation) => operation.action === 'send')
        return {
          onOpen: (_event, ws) => {
            log(`[ws] open ${channel.route}`)

            // Push a single message per receive operation on connect (quiet, deterministic default).
            for (const operation of receiveOperations) {
              const message = generateMessage({ ...channel, messages: operation.messages })
              if (message) {
                ws.send(message.data)
                onMessage?.({ channel: channel.id, direction: 'out', payload: message.data })
              }
            }
          },
          onMessage: (event, ws) => {
            if (!sendOperation && channel.operations.some((operation) => operation.action === 'send')) {
              ws.close(1008, 'Not authorized to send messages')
              return
            }
            const incoming = typeof event.data === 'string' ? event.data : '[binary]'
            log(`[ws] recv ${channel.route}: ${incoming}`)
            onMessage?.({ channel: channel.id, direction: 'in', payload: incoming })

            // Only echo a reply when the channel declares a `send` operation. Receive-only channels
            // (server push) stay quiet on inbound frames instead of fabricating an unsolicited reply.
            if (!sendOperation) {
              return
            }

            const reply = generateMessage({ ...channel, messages: sendOperation.messages })
            if (reply) {
              ws.send(reply.data)
              onMessage?.({ channel: channel.id, direction: 'out', payload: reply.data })
            }
          },
          onClose: () => log(`[ws] close ${channel.route}`),
        }
      }),
    )
  },
}
