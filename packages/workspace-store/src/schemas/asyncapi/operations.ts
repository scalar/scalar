import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Operation Action - publish or subscribe
const OperationActionSchema = Type.Union([Type.Literal('publish'), Type.Literal('subscribe')])

export type OperationAction = 'publish' | 'subscribe'

// Operation Schema
const OperationSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. The action that the operation performs. */
    'action': OperationActionSchema,
    /** REQUIRED. The channel that this operation is performed on. */
    'channel': Type.String(),
    /** A human-friendly title for the operation. */
    'title': Type.Optional(Type.String()),
    /** A short summary of what the operation is about. */
    'summary': Type.Optional(Type.String()),
    /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
    'description': Type.Optional(Type.String()),
    /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    'security': Type.Optional(Type.Array(Type.Any())), // Will be replaced with SecurityRequirementObjectRef
    /** A list of tags for logical grouping and categorization of operations. */
    'tags': Type.Optional(Type.Array(Type.Any())), // Will be replaced with TagObjectRef
    /** Additional external documentation for this operation. */
    'externalDocs': Type.Optional(Type.Any()), // Will be replaced with ExternalDocumentationObjectRef
    /** A map where the keys describe the name of the message and the values describe the message. */
    'messages': Type.Optional(Type.Array(Type.String())), // References to messages
    /** A $ref to the operation that this operation is a reply to. */
    'reply': Type.Optional(Type.Any()), // Will be replaced with proper reply object
    /** A list of $ref to the operations that can be performed after this operation. */
    'x-scalar-reply-to': Type.Optional(Type.Array(Type.String())), // Custom extension for reply relationships
  }),
)

export type Operation = {
  /** REQUIRED. The action that the operation performs. */
  'action': OperationAction
  /** REQUIRED. The channel that this operation is performed on. */
  'channel': string
  /** A human-friendly title for the operation. */
  'title'?: string
  /** A short summary of what the operation is about. */
  'summary'?: string
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  'description'?: string
  /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  'security'?: any[] // Will be replaced with SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of operations. */
  'tags'?: any[] // Will be replaced with TagObject[]
  /** Additional external documentation for this operation. */
  'externalDocs'?: any // Will be replaced with ExternalDocumentationObject
  /** A map where the keys describe the name of the message and the values describe the message. */
  'messages'?: string[] // References to messages
  /** A $ref to the operation that this operation is a reply to. */
  'reply'?: any // Will be replaced with proper reply object
  /** A list of $ref to the operations that can be performed after this operation. */
  'x-scalar-reply-to'?: string[] // Custom extension for reply relationships
}

// Operations Object Schema - map of operation IDs to operations
const OperationsObjectSchemaDefinition = Type.Record(Type.String(), OperationSchemaDefinition)

export type OperationsObject = Record<string, Operation>

// Module definition
const module = Type.Module({
  Operation: OperationSchemaDefinition,
  OperationsObject: OperationsObjectSchemaDefinition,
})

// Export schemas
export const OperationSchema = module.Import('Operation')
export const OperationsObjectSchema = module.Import('OperationsObject')
