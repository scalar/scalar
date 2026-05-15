import { object, optional, string } from '@scalar/validation'

export const asyncApiLicenseObject = object(
  {
    name: string({ typeComment: 'REQUIRED. The license name used for the API.' }),
    url: optional(
      string({
        typeComment: 'A URL to the license used for the API. This MUST be in the form of an absolute URL.',
      }),
    ),
  },
  { typeName: 'AsyncApiLicenseObject' },
)
