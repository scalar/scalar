/**
 * Contact object
 *
 * Contact information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#contact-object}
 */
export type ContactObject = {
  /** The identifying name of the contact person/organization. */
  name?: string
  /** The URL for the contact information. This MUST be in the form of a URL. */
  url?: string
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email?: string
}
