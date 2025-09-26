import { type Static, type TSchema, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

export const ReferenceObjectExtensionsSchema = Type.Object({
  /** Indicates the current status of the reference resolution. Can be either 'loading' while fetching the reference or 'error' if the resolution failed. */
  '$status': Type.Optional(Type.Union([Type.Literal('loading'), Type.Literal('error')])),
  /** Indicates whether this reference should be resolved globally across all documents, rather than just within the current document context. */
  '$global': Type.Optional(Type.Boolean()),
})

/**
 * A simple object to allow referencing other components in the OpenAPI Description, internally and externally.
 *
 * The $ref string value contains a URI RFC3986, which identifies the value being referenced.
 *
 * See the rules for resolving Relative References. */
export const ReferenceObjectSchema = compose(
  Type.Object({
    /** REQUIRED. The reference identifier. This MUST be in the form of a URI. */
    '$ref': Type.String(),
    /** A short summary which by default SHOULD override that of the referenced component. If the referenced object-type does not allow a summary field, then this field has no effect. */
    summary: Type.Optional(Type.String()),
    /** A description which by default SHOULD override that of the referenced component. CommonMark syntax MAY be used for rich text representation. If the referenced object-type does not allow a description field, then this field has no effect. */
    description: Type.Optional(Type.String()),
  }),
  ReferenceObjectExtensionsSchema,
)

export type ReferenceObject = Static<typeof ReferenceObjectSchema>

export const reference = <T extends TSchema>(schema: T) =>
  compose(ReferenceObjectSchema, Type.Object({ '$ref-value': schema }))

export type ReferenceType<Value> = ReferenceObject & { '$ref-value': Value }
