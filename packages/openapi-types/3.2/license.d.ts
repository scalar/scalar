/**
 * License object
 *
 * License information for the exposed API.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#license-object}
 */
export type LicenseObject = {
  /** **REQUIRED**. The license name used for the API. */
  name: string
  /** An [SPDX](https://spdx.org/licenses/) license expression for the API. The `identifier` field is mutually exclusive of the `url` field. */
  identifier?: string
  /** A URI for the license used for the API. This MUST be in the form of a URI. The `url` field is mutually exclusive of the `identifier` field. */
  url?: string
} & Record<`x-${string}`, unknown>
