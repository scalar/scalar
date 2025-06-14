import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/** Allows referencing an external resource for extended documentation. */
export const ExternalDocumentationObjectSchema = compose(
  Type.Object({
    /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** REQUIRED. The URI for the target documentation. This MUST be in the form of a URI. */
    url: Type.String(),
  }),
  ExtensionsSchema,
)

export type ExternalDocumentationObject = Static<typeof ExternalDocumentationObjectSchema>
