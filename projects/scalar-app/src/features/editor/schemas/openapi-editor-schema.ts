// Vendored from https://spec.openapis.org/oas/3.2/schema/2025-09-17.
import openApiSchema from './openapi-3.2-schema.json'

/** Offer OpenAPI 3.2 completion while allowing existing 3.1 documents to remain editable. */
export const openApiEditorSchema = {
  ...openApiSchema,
  $defs: {
    ...openApiSchema.$defs,
    // Monaco merges the extension $ref over sibling patternProperties, losing the path pattern.
    // Inline the extension pattern while retaining the other upstream constraints.
    paths: {
      ...openApiSchema.$defs.paths,
      $ref: undefined,
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
