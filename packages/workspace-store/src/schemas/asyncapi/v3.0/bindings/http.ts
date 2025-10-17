import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for an HTTP operation.
 */
export const HttpOperationBindingSchemaDefinition = Type.Object({
  /** Type of HTTP request. When using HTTP as the protocol, only request is allowed. */
  type: Type.Optional(Type.Literal('request')),
  /** The HTTP method to use. Its value MUST be one of GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, and TRACE. */
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
  /** A Schema object containing the definitions for HTTP-specific query parameters. This schema MUST be of type object and have a properties key. */
  query: Type.Optional(SchemaObjectRef),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an HTTP operation.
 */
export type HttpOperationBinding = {
  /** Type of HTTP request. When using HTTP as the protocol, only request is allowed. */
  type?: 'request'
  /** The HTTP method to use. Its value MUST be one of GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, and TRACE. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'
  /** A Schema object containing the definitions for HTTP-specific query parameters. This schema MUST be of type object and have a properties key. */
  query?: SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}

/**
 * Protocol-specific information for an HTTP message.
 */
export const HttpMessageBindingSchemaDefinition = Type.Object({
  /** A Schema object containing the definitions for HTTP-specific headers. This schema MUST be of type object and have a properties key. */
  headers: Type.Optional(SchemaObjectRef),
  /** The HTTP response status code according to RFC 9110. statusCode is only relevant for messages referenced by the Operation Reply Object. */
  statusCode: Type.Optional(Type.Number()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an HTTP message.
 */
export type HttpMessageBinding = {
  /** A Schema object containing the definitions for HTTP-specific headers. This schema MUST be of type object and have a properties key. */
  headers?: SchemaObject
  /** The HTTP response status code according to RFC 9110. statusCode is only relevant for messages referenced by the Operation Reply Object. */
  statusCode?: number
  /** The version of this binding. */
  bindingVersion?: string
}
