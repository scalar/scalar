import type { ContactObject } from './contact'
import type { LicenseObject } from './license'
/**
 * Info object
 *
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#info-object}
 */
export type InfoObject = {
  /** **REQUIRED**. The title of the API. */
  title: string
  /** A description of the API. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** A URL for the Terms of Service for the API. This MUST be in the form of a URL. */
  termsOfService?: string
  /** The contact information for the exposed API. */
  contact?: ContactObject
  /** The license information for the exposed API. */
  license?: LicenseObject
  /** **REQUIRED**. The version of the OpenAPI Document (which is distinct from the [OpenAPI Specification version](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#oas-version) or the version of the API being described or the version of the OpenAPI Description). */
  version: string
}
