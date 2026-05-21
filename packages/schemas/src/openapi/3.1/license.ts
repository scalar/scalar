import { object, optional, string } from '@scalar/validation'

export const license = object(
  {
    name: optional(string({ typeComment: 'REQUIRED. The license name used for the API.' })),
    identifier: optional(
      string({
        typeComment:
          'An SPDX license expression for the API. The identifier field is mutually exclusive of the url field.',
      }),
    ),
    url: optional(
      string({
        typeComment:
          'A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field.',
      }),
    ),
  },
  { typeName: 'LicenseObject' },
)
