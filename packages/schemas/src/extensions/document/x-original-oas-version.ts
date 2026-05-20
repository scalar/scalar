import { object, optional, string } from '@scalar/validation'

export const XOriginalOasVersion = object(
  {
    'x-original-oas-version': optional(
      string({
        typeComment: 'OpenAPI Specification version of the source document (for example `3.1.0`)',
      }),
    ),
  },
  {
    typeName: 'XOriginalOasVersion',
    typeComment:
      'Original OpenAPI Specification version of the source document before ingestion.\n\n@example\n```yaml\nx-original-oas-version: "3.1.0"\n```',
  },
)
