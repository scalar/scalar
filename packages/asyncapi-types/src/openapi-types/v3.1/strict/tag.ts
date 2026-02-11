import { Type } from '@scalar/typebox'

import type { ExternalDocumentationObject } from './external-documentation'
import { ExternalDocumentationObjectRef } from './ref-definitions'

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObjectSchemaDefinition = Type.Object({
  /** REQUIRED. The name of the tag. */
  name: Type.String(),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Additional external documentation for this tag. */
  externalDocs: Type.Optional(ExternalDocumentationObjectRef),
})

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export type TagObject = {
  /** REQUIRED. The name of the tag. */
  name: string
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocumentationObject
}
