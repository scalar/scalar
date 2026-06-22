import type { MockTransport } from '@/transports/types'

import { sseTransport } from './sse'
import { websocketTransport } from './websocket'

/**
 * Built-in transports, in match priority order. WebSocket is checked before SSE so a `ws`
 * channel is never claimed by the SSE fallback. Consumer transports are appended after these.
 */
export const defaultTransports: MockTransport[] = [websocketTransport, sseTransport]

export type {
  MessageDirection,
  MockMessage,
  MockTransport,
  ResolvedChannel,
  ResolvedMessage,
  ResolvedOperation,
  TransportContext,
} from '@/transports/types'

export { sseTransport } from './sse'
export { websocketTransport } from './websocket'
