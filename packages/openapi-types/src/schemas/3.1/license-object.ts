import { z } from 'zod'

/**
 * License Object
 *
 * License information for the exposed API.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#license-object
 */
export const LicenseObjectSchema = z.object({
  /** REQUIRED. The license name used for the API. */
  name: z.string().optional().nullable().catch(null),
  /** An SPDX license expression for the API. The identifier field is mutually exclusive of the url field. */
  identifier: z.string().optional().catch(undefined),
  /**
   * A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field.
   */
  url: z.string().url().optional().catch(undefined),
})
