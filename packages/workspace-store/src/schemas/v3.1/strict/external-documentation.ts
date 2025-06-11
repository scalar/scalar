import { Type, type Static } from '@sinclair/typebox'

/** Allows referencing an external resource for extended documentation. */
export const ExternalDocumentationObjectSchema = Type.Object({
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** REQUIRED. The URI for the target documentation. This MUST be in the form of a URI. */
  url: Type.String(),
})

export type ExternalDocumentationObject = Static<typeof ExternalDocumentationObjectSchema>
