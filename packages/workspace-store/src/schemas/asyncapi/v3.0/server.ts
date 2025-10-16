import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import {
  ExternalDocumentationObjectRef,
  SecurityRequirementObjectRef,
  TagObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

import { BindingRef, ServerVariableRef } from './ref-definitions'

/**
 * An object representing a Server Variable for server URL template substitution.
 */
export const ServerVariableSchemaDefinition = compose(
  Type.Object({
    /** An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty. */
    enum: Type.Optional(Type.Array(Type.String())),
    /** REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied. Note that this behavior is different from the Schema Object's default keyword, which documents the receiver's behavior rather than inserting the value into the data. */
    default: Type.String(),
    /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** An array of examples of the server variable. */
    examples: Type.Optional(Type.Array(Type.String())),
  }),
)

/**
 * An object representing a Server Variable for server URL template substitution.
 */
export type ServerVariable = {
  /** An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty. */
  enum?: string[]
  /** REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied. */
  default: string
  /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** An array of examples of the server variable. */
  examples?: string[]
}

/**
 * An object representing a Server.
 */
export const ServerSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. The server host name. It MAY include the port number if different from the protocol's default port. The host supports Server Variables and MAY have relative paths. Variable substitutions will be made when a variable is named in braces. */
    host: Type.String(),
    /** REQUIRED. The protocol this server supports for connection. */
    protocol: Type.String(),
    /** The version of the protocol used for connection. For instance: AMQP 0.9.1, HTTP 2.0, Kafka 1.0.0, etc. */
    protocolVersion: Type.Optional(Type.String()),
    /** An optional string describing the server. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** An optional human-friendly name for the server. */
    title: Type.Optional(Type.String()),
    /** A short summary of the server. */
    summary: Type.Optional(Type.String()),
    /** A map between a variable name and its value. The value is used for substitution in the server's host and pathname templates. */
    variables: Type.Optional(Type.Record(Type.String(), ServerVariableRef)),
    /** A declaration of which security mechanisms can be used with this server. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a connection or operation. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags for logical grouping and categorization of servers. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this server. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the server. */
    bindings: Type.Optional(BindingRef),
  }),
)

/**
 * An object representing a Server.
 */
export type Server = {
  /** REQUIRED. The server host name. It MAY include the port number if different from the protocol's default port. */
  host: string
  /** REQUIRED. The protocol this server supports for connection. */
  protocol: string
  /** The version of the protocol used for connection. For instance: AMQP 0.9.1, HTTP 2.0, Kafka 1.0.0, etc. */
  protocolVersion?: string
  /** An optional string describing the server. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** An optional human-friendly name for the server. */
  title?: string
  /** A short summary of the server. */
  summary?: string
  /** A map between a variable name and its value. The value is used for substitution in the server's host and pathname templates. */
  variables?: Record<string, ServerVariable>
  /** A declaration of which security mechanisms can be used with this server. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a connection or operation. */
  security?: SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of servers. */
  tags?: TagObject[]
  /** Additional external documentation for this server. */
  externalDocs?: ExternalDocumentationObject
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the server. */
  bindings?: Record<string, any>
}
