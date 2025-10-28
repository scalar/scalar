import { z } from 'zod'

import { ContactObjectSchema } from './contact-object'
import { LicenseObjectSchema } from './license-object'

/**
 * Info Object
 *
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed,
 * and MAY be presented in editing or documentation generation tools for convenience.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#info-object
 */
export const InfoObjectSchema = z.object({
  /**
   * REQUIRED. The title of the API.
   */
  title: z.string().default('API'),
  /**
   * A short summary of the API.
   */
  summary: z.string().optional(),
  /**
   * A description of the API. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
  /**
   * A URL to the Terms of Service for the API. This MUST be in the form of a URL.
   */
  termsOfService: z.string().url().optional(),
  /**
   * The contact information for the exposed API.
   */
  contact: ContactObjectSchema.optional(),
  /**
   * The license information for the exposed API.
   **/
  license: LicenseObjectSchema.optional(),
  /**
   * REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the
   * version of the API being described or the version of the OpenAPI Description).
   */
  version: z.string().default('1.0.0'),
})
