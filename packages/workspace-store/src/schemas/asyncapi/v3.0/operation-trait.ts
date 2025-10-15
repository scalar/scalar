import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

// Operation Trait Schema
export const OperationTraitSchemaDefinition = compose(
  Type.Object({
    /** A human-friendly title for the operation. */
    title: Type.Optional(Type.String()),
    /** A short summary of what the operation is about. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(Type.Any())), // Will be replaced with SecurityRequirementObjectRef
    /** A list of tags for logical grouping and categorization of operations. */
    tags: Type.Optional(Type.Array(Type.Any())), // Will be replaced with TagObjectRef
    /** Additional external documentation for this operation. */
    externalDocs: Type.Optional(Type.Any()), // Will be replaced with ExternalDocumentationObjectRef
    /** A $ref to the operation that this operation is a reply to. */
    reply: Type.Optional(Type.Any()), // Will be replaced with ReplyObjectRef
  }),
)

export type OperationTrait = {
  /** A human-friendly title for the operation. */
  title?: string
  /** A short summary of what the operation is about. */
  summary?: string
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  security?: any[] // Will be replaced with SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of operations. */
  tags?: any[] // Will be replaced with TagObject[]
  /** Additional external documentation for this operation. */
  externalDocs?: any // Will be replaced with ExternalDocumentationObject
  /** A $ref to the operation that this operation is a reply to. */
  reply?: any // Will be replaced with ReplyObject
}
