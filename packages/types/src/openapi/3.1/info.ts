import type { XScalarSdkInstallation } from '@scalar/types/extensions/document/x-scalar-sdk-installation'

import type { ContactObject } from './contact'
import type { LicenseObject } from './license'

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
