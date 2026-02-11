import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'
import type { SecurityRequirementObject } from '@/openapi-types/v3.1/strict/security-requirement'
import type { TagObject } from '@/openapi-types/v3.1/strict/tag'

import type { ServerBindingsObject } from './binding'

/**
 * An object representing a Server Variable for server URL template substitution.
 */
export type ServerVariableObject = {
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
export type ServerObject = {
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
  variables?: Record<string, ServerVariableObject>
  /** A declaration of which security mechanisms can be used with this server. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a connection or operation. */
  security?: SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of servers. */
  tags?: TagObject[]
  /** Additional external documentation for this server. */
  externalDocs?: ExternalDocumentationObject
  /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the server. */
  bindings?: ServerBindingsObject
}
