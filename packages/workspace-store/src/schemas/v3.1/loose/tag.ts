import { Type, type Static } from '@sinclair/typebox'

import { compose } from '@/schemas/compose'

import { ExternalDocumentationObjectSchema } from './external-documentation'
import { XDisplayNameSchema } from '@/schemas/extensions/tag/x-display-name'
import { XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { XInternalSchema } from '@/schemas/extensions/document/x-internal'

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObjectSchema = compose(
  Type.Object({
    /** The name of the tag. */
    name: Type.Optional(Type.String()),
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
