import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'

/**
 * A message resolved from an AsyncAPI channel/operation, with `$ref`s already resolved.
 * The `payload` is a plain JSON Schema ready to feed to `getExampleFromSchema`.
 */
export type ResolvedMessage = {
  /** The message id (its key in `channel.messages`), used as the default event name. */
  id: string
  /** The JSON Schema for the message payload, or `undefined` when the message has no payload. */
  payload?: OpenAPIV3_1.SchemaObject
  /** Named/inline examples defined on the message, preferred over generated payloads. */
  examples: unknown[]
  /** Content type used to encode the payload (defaults to the document's `defaultContentType`). */
  contentType?: string
}

/** A single AsyncAPI operation (`send`/`receive`) bound to its channel. */
export type ResolvedOperation = {
  /** The operation id (its key in the document's `operations` map). */
  id: string
  /**
   * `send`: the application sends to the channel, so the mock *receives* a client message
   * and echoes a reply. `receive`: the application receives from the channel, so the mock
   * *pushes* a message to the client.
   */
  action: 'send' | 'receive'
  /** Messages this operation may carry (a subset of the channel's messages, or all of them). */
  messages: ResolvedMessage[]
}

/** A normalized, dereferenced view of an AsyncAPI channel that a transport can serve. */
export type ResolvedChannel = {
  /** The channel id (its key in the document's `channels` map). */
  id: string
  /** The raw channel address, e.g. `user/signedup` or `rooms/{roomId}`. */
  address: string
  /** Hono-style route derived from the address (`rooms/{roomId}` -> `/rooms/:roomId`). */
  route: string
  /** Connection protocols advertised by the channel's servers, e.g. `['ws']`, `['sse']`. */
  protocols: string[]
  /** Operations targeting this channel. */
  operations: ResolvedOperation[]
  /** All messages declared on the channel. */
  messages: ResolvedMessage[]
}

/** An encoded frame ready to write to a transport, plus the optional event name. */
export type MockMessage = {
  /** The wire payload (already encoded per the message `contentType`). */
  data: string
  /** Event name (the message id), surfaced by transports that support named events (SSE). */
  event?: string
}

/** Direction of a message relative to the mock server. */
export type MessageDirection = 'in' | 'out'

/**
 * Everything a transport needs to register a channel on the running server. The core builds
 * this once and passes it to every transport's {@link MockTransport.register}.
 */
export type TransportContext = {
  /** The Hono app. HTTP-based transports (SSE, SignalR negotiate) register routes here. */
  app: Hono
  /**
   * Hono's WebSocket upgrade helper, bound to the Node adapter. Upgrade-based transports
   * (WebSocket, SignalR) register sockets via `app.get(route, upgradeWebSocket(...))`.
   */
  upgradeWebSocket: UpgradeWebSocket
  /**
   * Generate an encoded mock message for a channel. When `messageId` is omitted the first
   * available message is used. Returns `null` when the channel declares no messages.
   */
  generateMessage: (channel: ResolvedChannel, messageId?: string) => MockMessage | null
  /** Notifies the caller about every message flowing in or out, for logging/inspection. */
  onMessage?: (event: { channel: string; direction: MessageDirection; payload: unknown }) => void
  /** Structured logger for transport lifecycle lines. */
  log: (line: string) => void
}

/**
 * A pluggable transport that knows how to serve a class of AsyncAPI channels (by protocol).
 * Built-in transports cover WebSocket and SSE; consumers can append their own (e.g. SignalR)
 * via {@link AsyncApiMockServerOptions.transports} without changing the core.
 */
export type MockTransport = {
  /** Unique transport id, e.g. `websocket`, `sse`. */
  name: string
  /** Whether this transport should own the given channel. The first match wins. */
  supports: (channel: ResolvedChannel) => boolean
  /** Register the channel on the server. Called once per matching channel at startup. */
  register: (channel: ResolvedChannel, context: TransportContext) => void
}
