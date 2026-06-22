import { streamSSE } from 'hono/streaming'

import type { MockTransport, ResolvedOperation } from '@/transports/types'

/**
 * Built-in Server-Sent Events transport. Serves one-way, server-push channels over HTTP: a `GET`
 * on the channel route opens an SSE stream and emits a generated message per `receive` operation.
 *
 * Claims channels whose servers speak `sse`, or plain `http`/`https` channels that have at least
 * one `receive` operation (a server-push channel). WebSocket takes precedence for `ws` channels
 * because it is registered first in the default transport list.
 */
export const sseTransport: MockTransport = {
  name: 'sse',
  supports: (channel) => {
    if (channel.protocols.includes('sse')) {
      return true
    }

    const isHttp = channel.protocols.includes('http') || channel.protocols.includes('https')
    const hasServerPush = channel.operations.some((operation) => operation.action === 'receive')
    return isHttp && hasServerPush
  },
  register: (channel, context) => {
    const { app, generateMessage, onMessage, log } = context

    const receiveOperations = channel.operations.filter((operation) => operation.action === 'receive')
    // Fall back to all channel messages when the channel has no explicit receive operation.
    const operations: Pick<ResolvedOperation, 'messages'>[] =
      receiveOperations.length > 0 ? receiveOperations : [{ messages: channel.messages }]

    app.get(channel.route, (c) =>
      streamSSE(c, async (stream) => {
        log(`[sse] open ${channel.route}`)

        for (const operation of operations) {
          const message = generateMessage(channel, operation.messages[0]?.id)
          if (message) {
            await stream.writeSSE({ data: message.data, event: message.event })
            onMessage?.({ channel: channel.id, direction: 'out', payload: message.data })
          }
        }

        log(`[sse] close ${channel.route}`)
      }),
    )
  },
}
