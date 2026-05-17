export type LicenseObject = {
  /** REQUIRED. The license name used for the API. */
  name?: string
  /** An SPDX license expression for the API. The identifier field is mutually exclusive of the url field. */
  identifier?: string
  /** A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field. */
  url?: string
}
