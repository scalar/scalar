/**
 * Contact object
 *
 * Contact information for the exposed API.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#contact-object}
 */
export type ContactObject = {
  /** The identifying name of the contact person/organization. */
  name?: string
  /** The URL for the contact information. This MUST be in the form of a URL. */
  url?: string
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email?: string
} & Record<`x-${string}`, unknown>
