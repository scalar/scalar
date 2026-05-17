import { object, optional, string } from '@scalar/validation'

export const XOriginalOasVersion = object(
  {
    'x-original-oas-version': optional(
      string({ typeComment: 'Original OpenAPI Specification version of the source document.' }),
    ),
  },
  {
    typeName: 'XOriginalOasVersion',
    typeComment: 'Original OpenAPI Specification version of the source document',
  },
)
