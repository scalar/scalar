import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'
import {
  ExternalDocumentationObjectRef,
  SecurityRequirementObjectRef,
  TagObjectRef,
} from '@/openapi-types/v3.1/strict/ref-definitions'

import { ReplyObjectRef } from './ref-definitions'

/**o an Operation Object.
 * This object MAY contain any property from the Operation Object, except action and channel.
 */
export const OperationTraitObjectSchemaDefinition = compose(
  Type.Object({
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
    /** A definition of the reply in a request-reply operation. */
    reply: Type.Optional(ReplyObjectRef),
  }),
)
