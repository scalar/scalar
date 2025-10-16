import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for an HTTP server.
 */
export const HttpBindingSchemaDefinition = Type.Object({
  /** Type of HTTP request. When using HTTP as the protocol, only request is allowed. */
  type: Type.Optional(Type.Literal('request')),
  /** The HTTP method to use when establishing the connection. Its value MUST be either GET or POST. */
  method: Type.Optional(
    Type.Union([
      Type.Literal('GET'),
      Type.Literal('POST'),
      Type.Literal('PUT'),
      Type.Literal('PATCH'),
      Type.Literal('DELETE'),
      Type.Literal('HEAD'),
      Type.Literal('OPTIONS'),
      Type.Literal('CONNECT'),
      Type.Literal('TRACE'),
    ]),
  ),
  /** A Schema object containing the definitions for HTTP-specific query parameters. */
  query: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an HTTP server.
 */
export type HttpBinding = {
  /** Type of HTTP request. When using HTTP as the protocol, only request is allowed. */
  type?: 'request'
  /** The HTTP method to use when establishing the connection. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'
  /** A Schema object containing the definitions for HTTP-specific query parameters. */
  query?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
