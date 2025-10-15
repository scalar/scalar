import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

import type { ExternalDocumentationObject } from '../v3.1/strict/external-documentation'
import {
  ExternalDocumentationObjectRef,
  SecurityRequirementObjectRef,
  TagObjectRef,
} from '../v3.1/strict/ref-definitions'
import type { SecurityRequirementObject } from '../v3.1/strict/security-requirement'
import type { TagObject } from '../v3.1/strict/tag'
import type { Binding } from './binding'
import { BindingSchema } from './binding'

// Server Variable Schema
const ServerVariableSchemaDefinition = compose(
  Type.Object({
    /** An enumeration of string values to be used if the substitution options are from a limited set. */
    enum: Type.Optional(Type.Array(Type.String())),
    /** The default value to use for substitution, and to send, if an alternate value is not supplied. */
    default: Type.String(),
    /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** An array of examples of the server variable. */
    examples: Type.Optional(Type.Array(Type.String())),
  }),
)

export type ServerVariable = {
  /** An enumeration of string values to be used if the substitution options are from a limited set. */
  enum?: string[]
  /** The default value to use for substitution, and to send, if an alternate value is not supplied. */
  default: string
  /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** An array of examples of the server variable. */
  examples?: string[]
}

// Server Schema - AsyncAPI server with WebSocket protocol support
const ServerSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the AsyncAPI document is being served. Variable substitutions will be made when a variable is part of the URL. */
    url: Type.String(),
    /** The protocol this URL supports for connection. Supported protocol include, but are not limited to: amqp, amqps, http, https, ibmmq, jms, kafka, kafka-secure, mqtt, mqtts, stomp, stomps, ws, wss, mercure. */
    protocol: Type.String(),
    /** The version of the protocol used for connection. For instance: AMQP 0.9.1, HTTP 2.0, Kafka 1.0.0, etc. */
    protocolVersion: Type.Optional(Type.String()),
    /** A human-friendly title for the server. */
    title: Type.Optional(Type.String()),
    /** A short summary of the server. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the server behavior. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
    variables: Type.Optional(Type.Record(Type.String(), ServerVariableSchemaDefinition)),
    /** A declaration of which security mechanisms can be used with this server. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a connection or operation. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags for logical grouping and categorization of servers. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this server. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** A map of bindings for this server. */
    bindings: Type.Optional(BindingSchema),
  }),
)

export type Server = {
  /** REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the AsyncAPI document is being served. Variable substitutions will be made when a variable is part of the URL. */
  url: string
  /** The protocol this URL supports for connection. Supported protocol include, but are not limited to: amqp, amqps, http, https, ibmmq, jms, kafka, kafka-secure, mqtt, mqtts, stomp, stomps, ws, wss, mercure. */
  protocol: string
  /** The version of the protocol used for connection. For instance: AMQP 0.9.1, HTTP 2.0, Kafka 1.0.0, etc. */
  protocolVersion?: string
  /** A human-friendly title for the server. */
  title?: string
  /** A short summary of the server. */
  summary?: string
  /** A verbose explanation of the server behavior. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
  variables?: Record<string, ServerVariable>
  /** A declaration of which security mechanisms can be used with this server. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a connection or operation. */
  security?: SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of servers. */
  tags?: TagObject[]
  /** Additional external documentation for this server. */
  externalDocs?: ExternalDocumentationObject
  /** A map of bindings for this server. */
  bindings?: Binding
}

// Module definition
const module = Type.Module({
  ServerVariable: ServerVariableSchemaDefinition,
  Server: ServerSchemaDefinition,
})

// Export schemas
export const ServerVariableSchema = module.Import('ServerVariable')
export const ServerSchema = module.Import('Server')
