import { object, optional, string } from '@scalar/validation'

import { asyncApiContactObject } from './contact'
import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiLicenseObject } from './license'
import { asyncApiTagsObject } from './tag'

export const asyncApiInfoObject = object(
  {
    title: string({ typeComment: 'REQUIRED. The title of the application.' }),
    version: string({
      typeComment:
        'REQUIRED. Provides the version of the application API (not to be confused with the AsyncAPI Specification version).',
    }),
    description: optional(
      string({
        typeComment:
          'A short description of the application. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    termsOfService: optional(string({ typeComment: 'A URL to the Terms of Service for the API (absolute URL).' })),
    contact: optional(asyncApiContactObject),
    license: optional(asyncApiLicenseObject),
    tags: optional(asyncApiTagsObject),
    externalDocs: optional(asyncApiExternalDocumentationObject),
  },
  { typeName: 'AsyncApiInfoObject' },
)
