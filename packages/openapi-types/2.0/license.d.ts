/**
 * License object
 *
 * License information for the exposed API.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#license-object}
 */
export type LicenseObject = {
  /** **Required.** The license name used for the API. */
  name: string
  /** A URL to the license used for the API. MUST be in the format of a URL. */
  url?: string
}
