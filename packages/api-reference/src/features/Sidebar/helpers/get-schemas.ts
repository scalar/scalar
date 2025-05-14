import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Returns all schemas from the OpenAPI document.
 */
export function getSchemas(
  content?: OpenAPIV3_1.Document,
  {
    filter,
  }: {
    filter?: (schema: OpenAPIV3_1.SchemaObject) => boolean
  } = {},
) {
  if (!content) {
    return {} as Record<string, OpenAPIV3_1.SchemaObject>
  }

  const schemas =
    // OpenAPI 3.x
    (
      Object.keys(content?.components?.schemas ?? {}).length
        ? content?.components?.schemas
        : // Fallback
          {}
    ) as Record<string, OpenAPIV3_1.SchemaObject>

  if (filter) {
    return Object.fromEntries(Object.entries(schemas).filter(([_, schema]) => filter(schema)))
  }

  return schemas
}
