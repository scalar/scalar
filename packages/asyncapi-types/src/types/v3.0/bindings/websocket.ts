import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

/**
 * Protocol-specific information for a WebSocket channel.
 * When using WebSockets, the channel represents the connection.
 */
export type WebSocketChannelBinding = {
  /** The HTTP method to use when establishing the connection. Its value MUST be either GET or POST. */
  method?: 'GET' | 'POST'
  /** A Schema object containing the definitions for each query parameter. This schema MUST be of type object and have a properties key. */
  query?: SchemaObject
  /** A Schema object containing the definitions of the HTTP headers to use when establishing the connection. This schema MUST be of type object and have a properties key. */
  headers?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
