import { Type, type Static } from '@scalar/typebox'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { compose } from '@/schemas/compose'
import { XDisplayNameSchema } from '@/schemas/extensions/tag/x-display-name'
import { XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'

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
  XDisplayNameSchema,
  XInternalSchema,
  XScalarIgnoreSchema,
)

export type TagObject = Static<typeof TagObjectSchema>
