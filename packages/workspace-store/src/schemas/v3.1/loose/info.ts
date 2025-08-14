import { Type } from '@sinclair/typebox'

import { compose } from '@/schemas/compose'

import { ContactObjectSchema } from './contact'
import { LicenseObjectSchema } from './license'
import { ReferenceObjectSchema } from './reference'
import { XScalarSdkInstallationSchema } from '@/schemas/extensions/document/x-scalar-sdk-installation'

/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.
 */
export const InfoObjectSchema = compose(
  Type.Object({
    /** The title of the API. */
    title: Type.Optional(Type.String()),
    /** The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description). */
    version: Type.Optional(Type.String()),
    /** A short summary of the API. */
    summary: Type.Optional(Type.String()),
    /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A URI for the Terms of Service for the API. This MUST be in the form of a URI. */
    termsOfService: Type.Optional(Type.String()),
    /** The contact information for the exposed API. */
    contact: Type.Optional(Type.Union([ContactObjectSchema, ReferenceObjectSchema])),
    /** The license information for the exposed API. */
    license: Type.Optional(Type.Union([LicenseObjectSchema, ReferenceObjectSchema])),
  }),
  XScalarSdkInstallationSchema,
)
