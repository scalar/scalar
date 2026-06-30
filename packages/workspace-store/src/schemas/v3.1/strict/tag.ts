import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { type XInternal, XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { type XScalarIgnore, XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { type XScalarOrder, XScalarOrderSchema } from '@/schemas/extensions/general/x-scalar-order'
import { type XDisplayName, XDisplayNameSchema } from '@/schemas/extensions/tag/x-display-name'

import type { ExternalDocumentationObject } from './external-documentation'
import { ExternalDocumentationObjectRef } from './ref-definitions'

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export const TagObjectSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. The name of the tag. */
    name: Type.String(),
    /** A short summary of the tag, used for display purposes. (OpenAPI 3.2) */
    summary: Type.Optional(Type.String()),
    /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** The name of a tag that this tag is nested under. The named tag MUST exist in the API description, and circular references MUST NOT be used. (OpenAPI 3.2) */
    parent: Type.Optional(Type.String()),
    /** A machine-readable string to categorize what sort of tag it is, for example `nav`, `badge` or `audience`. (OpenAPI 3.2) */
    kind: Type.Optional(Type.String()),
    /** Additional external documentation for this tag. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
  }),
  XDisplayNameSchema,
  XInternalSchema,
  XScalarIgnoreSchema,
  XScalarOrderSchema,
)

/** Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag defined in the Operation Object instances. */
export type TagObject = {
  /** REQUIRED. The name of the tag. */
  name: string
  /** A short summary of the tag, used for display purposes. (OpenAPI 3.2) */
  summary?: string
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** The name of a tag that this tag is nested under. The named tag MUST exist in the API description, and circular references MUST NOT be used. (OpenAPI 3.2) */
  parent?: string
  /** A machine-readable string to categorize what sort of tag it is, for example `nav`, `badge` or `audience`. (OpenAPI 3.2) */
  kind?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocumentationObject
} & XDisplayName &
  XInternal &
  XScalarIgnore &
  XScalarOrder
