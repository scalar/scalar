import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/** The license information for the exposed API. */
export const LicenseObjectSchema = compose(
  Type.Object({
    /** REQUIRED. The license name used for the API. */
    name: Type.Optional(Type.String()),
    /** An SPDX license expression for the API. The identifier field is mutually exclusive of the url field. */
    identifier: Type.Optional(Type.String()),
    /** A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field. */
    url: Type.Optional(Type.String()),
  }),
  ExtensionsSchema,
)

export type LicenseObject = Static<typeof LicenseObjectSchema>
