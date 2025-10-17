import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for a WebSocket channel.
 * When using WebSockets, the channel represents the connection.
 */
export const WebSocketChannelBindingSchemaDefinition = Type.Object({
  /** The HTTP method to use when establishing the connection. Its value MUST be either GET or POST. */
  method: Type.Optional(Type.Union([Type.Literal('GET'), Type.Literal('POST')])),
  /** A Schema object containing the definitions for each query parameter. This schema MUST be of type object and have a properties key. */
  query: Type.Optional(SchemaObjectRef),
  /** A Schema object containing the definitions of the HTTP headers to use when establishing the connection. This schema MUST be of type object and have a properties key. */
  headers: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

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
