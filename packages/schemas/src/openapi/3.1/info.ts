import { intersection, object, optional, string } from '@scalar/validation'

import { XScalarSdkInstallation } from '@/extensions/document'

import { openApiContactObject } from './contact'
import { openApiLicenseObject } from './license'

export const openApiInfoObject = intersection(
  [
    object({
      title: string({ typeComment: 'REQUIRED. The title of the API.' }),
      version: string({
        typeComment:
          'REQUIRED. The version of the OpenAPI Document (which is distinct from the OpenAPI Specification version or the version of the API being described or the version of the OpenAPI Description).',
      }),
      summary: optional(string({ typeComment: 'A short summary of the API.' })),
      description: optional(
        string({
          typeComment: 'A description of the API. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      termsOfService: optional(
        string({ typeComment: 'A URI for the Terms of Service for the API. This MUST be in the form of a URI.' }),
      ),
      contact: optional(openApiContactObject),
      license: optional(openApiLicenseObject),
    }),
    XScalarSdkInstallation,
  ],
  { typeName: 'InfoObject' },
)
