import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import {
  type XScalarSdkInstallation,
  XScalarSdkInstallationSchema,
} from '@/schemas/extensions/document/x-scalar-sdk-installation'

import type { ContactObject } from './contact'
import type { LicenseObject } from './license'
import { ContactObjectRef, LicenseObjectRef } from './ref-definitions'

/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.
 */
export const InfoObjectSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. The title of the API. */
    title: Type.String(),
    /** REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description). */
    version: Type.String(),
    /** A short summary of the API. */
    summary: Type.Optional(Type.String()),
    /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A URI for the Terms of Service for the API. This MUST be in the form of a URI. */
    termsOfService: Type.Optional(Type.String()),
    /** The contact information for the exposed API. */
    contact: Type.Optional(ContactObjectRef),
    /** The license information for the exposed API. */
    license: Type.Optional(LicenseObjectRef),
  }),
  XScalarSdkInstallationSchema,
)

/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.
 */
export type InfoObject = {
  /** REQUIRED. The title of the API. */
  title: string
  /** REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description). */
  version: string
  /** A short summary of the API. */
  summary?: string
  /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A URI for the Terms of Service for the API. This MUST be in the form of a URI. */
  termsOfService?: string
  /** The contact information for the exposed API. */
  contact?: ContactObject
  /** The license information for the exposed API. */
  license?: LicenseObject
} & XScalarSdkInstallation
