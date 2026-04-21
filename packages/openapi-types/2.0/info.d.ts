import type { ContactObject } from './contact'
import type { Extensions } from './schema'
import type { LicenseObject } from './license'
/**
 * Info object
 *
 * The object provides metadata about the API. The metadata can be used by the clients if needed, and can be presented in the Swagger-UI for convenience.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#info-object}
 */
export type InfoObject = {
  /** **Required.** The title of the application. */
  title: string
  /** **Required** Provides the version of the application API (not to be confused with the specification version). */
  version: string
  /** A short description of the application. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** The Terms of Service for the API. */
  termsOfService?: string
  /** The contact information for the exposed API. */
  contact?: ContactObject
  /** The license information for the exposed API. */
  license?: LicenseObject
} & Extensions
