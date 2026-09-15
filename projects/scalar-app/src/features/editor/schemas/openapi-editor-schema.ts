// Vendored from https://spec.openapis.org/oas/3.2/schema/2025-09-17.
import openApiSchema from './openapi-3.2-schema.json'

/** Offer OpenAPI 3.2 completion while allowing existing 3.1 documents to remain editable. */
export const openApiEditorSchema = {
  ...openApiSchema,
  $defs: {
    ...openApiSchema.$defs,
    // Monaco does not track evaluated pattern properties across the extension $ref here.
    // Keep the explicit path/extension patterns used by the previous editor schema.
    paths: {
      ...openApiSchema.$defs.paths,
      patternProperties: {
        ...openApiSchema.$defs.paths.patternProperties,
        '^x-': true,
      },
      additionalProperties: false,
    },
  },
  properties: {
    ...openApiSchema.properties,
    openapi: {
      ...openApiSchema.properties.openapi,
      pattern: '^3\\.(1|2)\\.\\d+(-.+)?$',
    },
  },
}
