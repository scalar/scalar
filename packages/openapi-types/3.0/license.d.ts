/**
 * License object
 *
 * License information for the exposed API.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#license-object}
 */
export type LicenseObject = {
  /** **REQUIRED**. The license name used for the API. */
  name: string
  /** A URL for the license used for the API. This MUST be in the form of a URL. */
  url?: string
}
