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
  title: z.string().catch('API'),
  /**
   * A short summary of the API.
   */
  summary: z.string().optional().catch(undefined),
  /**
   * A description of the API. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional().catch(undefined),
  /**
   * A URL to the Terms of Service for the API. This MUST be in the form of a URL.
   */
  termsOfService: z.string().url().optional().catch(undefined),
  /**
   * The contact information for the exposed API.
   */
  contact: ContactObjectSchema.optional().catch(undefined),
  /**
   * The license information for the exposed API.
   **/
  license: LicenseObjectSchema.optional().catch(undefined),
  /**
   * REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the
   * version of the API being described or the version of the OpenAPI Description).
   */
  version: z.string().catch('1.0'),
})
