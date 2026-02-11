import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'
import type { SecurityRequirementObject } from '@/openapi-types/v3.1/strict/security-requirement'
import type { TagObject } from '@/openapi-types/v3.1/strict/tag'

import type { ReplyObject } from './reply'

/**
 * Describes a trait that MAY be applied to an Operation Object.
 * This object MAY contain any property from the Operation Object, except action and channel.
 */
export type OperationTraitObject = {
  /** A human-friendly title for the operation. */
  title?: string
  /** A short summary of what the operation is about. */
  summary?: string
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A declaration of which security mechanisms can be used for this operation. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags for logical grouping and categorization of operations. */
  tags?: TagObject[]
  /** Additional external documentation for this operation. */
  externalDocs?: ExternalDocumentationObject
  /** A definition of the reply in a request-reply operation. */
  reply?: ReplyObject
}
