import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { XDisplayNameSchema } from '@/schemas/extensions/tag/x-display-name'
import { ExternalDocumentationObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObjectSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. The name of the tag. */
    name: Type.String(),
    /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** Additional external documentation for this tag. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
  }),
  XDisplayNameSchema,
  XInternalSchema,
  XScalarIgnoreSchema,
)
