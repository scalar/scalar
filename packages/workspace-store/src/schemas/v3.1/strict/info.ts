import { Type, type Static } from '@sinclair/typebox'
import { ContactObjectSchema } from './contact'
import { LicenseObjectSchema } from './license'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.
 */
export const InfoObjectSchema = compose(
  Type.Object({
    /** REQUIRED. The title of the API. */
    title: Type.String(),
    /** A short summary of the API. */
    summary: Type.Optional(Type.String()),
    /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A URI for the Terms of Service for the API. This MUST be in the form of a URI. */
    termsOfService: Type.Optional(Type.String()),
    /** The contact information for the exposed API. */
    contact: Type.Optional(ContactObjectSchema),
    /** The license information for the exposed API. */
    license: Type.Optional(LicenseObjectSchema),
    /** REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description). */
    version: Type.String(),
  }),
  ExtensionsSchema,
)

export type InfoObject = Static<typeof InfoObjectSchema>
