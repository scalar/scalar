import { Type, type Static } from '@sinclair/typebox'

import { compose } from '@/schemas/compose'

import { ExtensionsSchema } from './extensions'

/** Allows referencing an external resource for extended documentation. */
export const ExternalDocumentationObjectSchema = compose(
  Type.Object({
    /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** The URI for the target documentation. This MUST be in the form of a URI. */
    url: Type.Optional(Type.String()),
  }),
  ExtensionsSchema,
)

export type ExternalDocumentationObject = Static<typeof ExternalDocumentationObjectSchema>
