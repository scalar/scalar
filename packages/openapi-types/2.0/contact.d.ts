/**
 * Contact object
 *
 * Contact information for the exposed API.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#contact-object}
 */
export type ContactObject = {
  /** The identifying name of the contact person/organization. */
  name?: string
  /** The URL pointing to the contact information. MUST be in the format of a URL. */
  url?: string
  /** The email address of the contact person/organization. MUST be in the format of an email address. */
  email?: string
}
