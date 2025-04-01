import { z } from 'zod'

/**
 * Contact Object
 *
 * Contact information for the exposed API.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#contact-object
 */
export const ContactObjectSchema = z.object({
  /** The identifying name of the contact person/organization. */
  name: z.string().optional(),
  /** The URL pointing to the contact information. This MUST be in the form of a URL. */
  url: z.string().url().optional().catch(undefined),
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email: z.string().optional().catch(undefined),
})
