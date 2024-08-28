import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

/**
 * Returns all models from the specification, no matter if it’s Swagger 2.0 or OpenAPI 3.x.
 */
export function getModels(spec?: Spec) {
  if (!spec) {
    return {} as Record<string, OpenAPIV3_1.SchemaObject>
  }

  const models =
    // OpenAPI 3.x
    (
      Object.keys(spec?.components?.schemas ?? {}).length
        ? spec?.components?.schemas
        : // Swagger 2.0
          Object.keys(spec?.definitions ?? {}).length
          ? spec?.definitions
          : // Fallback
            {}
    ) as
      | OpenAPIV2.DefinitionsObject
      | Record<string, OpenAPIV3.SchemaObject>
      | Record<string, OpenAPIV3_1.SchemaObject>

  // Filter out all schemas with `x-internal: true`
  Object.keys(models ?? {}).forEach((key) => {
    if (models[key]?.['x-internal'] === true) {
      delete models[key]
    }
  })

  return models
}
