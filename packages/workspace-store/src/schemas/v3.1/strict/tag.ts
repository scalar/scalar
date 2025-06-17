import { Type, type Static } from '@sinclair/typebox'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

const TagExtensionsSchema = Type.Partial(
  Type.Object({
    'x-displayName': Type.String(),
  }),
)

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObjectSchema = compose(
  Type.Object({
    /** REQUIRED. The name of the tag. */
    name: Type.String(),
    /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** Additional external documentation for this tag. */
    externalDocs: Type.Optional(ExternalDocumentationObjectSchema),
  }),
  TagExtensionsSchema,
  ExtensionsSchema,
)

export type TagObject = Static<typeof TagObjectSchema>
