import { Type } from '@scalar/typebox'

/** Contact information for the exposed API. */
export const ContactObjectSchemaDefinition = Type.Object({
  /** The identifying name of the contact person/organization. */
  name: Type.Optional(Type.String()),
  /** The URI for the contact information. This MUST be in the form of a URI. */
  url: Type.Optional(Type.String()),
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email: Type.Optional(Type.String()),
})
