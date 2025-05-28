import { Type } from '@sinclair/typebox'
import { ExternalDocumentationObject } from './external-documentation'

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObject = Type.Object({
  /** REQUIRED. The name of the tag. */
  name: Type.String(),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Additional external documentation for this tag. */
  externalDocs: Type.Optional(ExternalDocumentationObject),
})
