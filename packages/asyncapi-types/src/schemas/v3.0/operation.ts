import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'
import {
  ExternalDocumentationObjectRef,
  SecurityRequirementObjectRef,
  TagObjectRef,
} from '@/openapi-types/v3.1/strict/ref-definitions'

export const OperationActionSchema = Type.Union([Type.Literal('send'), Type.Literal('receive')])

/**
 * Describes a specific operation.
 */
export const OperationSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. Use send when it's expected that the application will send a message to the given channel, and receive when the application should expect receiving messages from the given channel. */
    action: OperationActionSchema,
    /** REQUIRED. A $ref pointer to the definition of the channel in which this operation is performed. */
    channel: Type.String(),
    /** A human-friendly title for the operation. */
    title: Type.Optional(Type.String()),
    /** A short summary of what the operation is about. */
    summary: Type.Optional(Type.String()),
    /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags for logical grouping and categorization of operations. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation for this operation. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** A list of $ref pointers to the supported Message Objects that can be processed by this operation. */
    messages: Type.Optional(Type.Array(Type.String())),
    /** Additional definition of the reply in a request-reply operation. */
    reply: Type.Optional(ReplyObjectRef),
    /** A list of traits to apply to the operation object. Traits MUST be merged using traits merge mechanism. The resulting object MUST be a valid Operation Object. */
    traits: Type.Optional(Type.Array(OperationTraitObjectRef)),
    /** A map where the keys describe the name of the protocol and the values describe protocol-specific definitions for the operation. */
    bindings: Type.Optional(OperationBindingsObjectRef),
  }),
)
