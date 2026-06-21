import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getAsyncApiServers } from '@scalar/workspace-store/channel-example'

/**
 * Server names and protocols a channel is available on.
 *
 * Resolved from `document.servers`, restricted to `channel.servers` when the channel declares them.
 * `webSocketOnly` is disabled so labels cover every protocol, not just WebSocket, and protocols are
 * de-duplicated while preserving declaration order.
 */
export const getChannelServerLabels = (
  document: AsyncApiDocument,
  channel: AsyncApiChannelObject | null | undefined,
): { servers: string[]; protocols: string[] } => {
  const entries = getAsyncApiServers(document, {
    channel: channel ?? null,
    webSocketOnly: false,
  })

  return {
    servers: entries.map((entry) => entry.name),
    protocols: [...new Set(entries.map((entry) => entry.protocol).filter(Boolean))],
  }
}
