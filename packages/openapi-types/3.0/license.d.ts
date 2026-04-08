/**
 * License object
 *
 * License information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#license-object}
 */
export type LicenseObject = {
  /** **REQUIRED**. The license name used for the API. */
  name: string
  /** A URL for the license used for the API. This MUST be in the form of a URL. */
  url?: string
}
