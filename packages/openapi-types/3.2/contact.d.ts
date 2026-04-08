/**
 * Contact object
 *
 * Contact information for the exposed API.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#contact-object}
 */
export type ContactObject = {
  /** The identifying name of the contact person/organization. */
  name?: string
  /** The URI for the contact information. This MUST be in the form of a URI. */
  url?: string
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email?: string
} & Record<`x-${string}`, unknown>
