import { Type } from '@scalar/typebox'

/** Allows referencing an external resource for extended documentation. */
export const ExternalDocumentationObjectSchemaDefinition = Type.Object({
  /** REQUIRED. The URI for the target documentation. This MUST be in the form of a URI. */
  url: Type.String(),
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
})

/** Allows referencing an external resource for extended documentation. */
export type ExternalDocumentationObject = {
  /** REQUIRED. The URI for the target documentation. This MUST be in the form of a URI. */
  url: string
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description?: string
}
