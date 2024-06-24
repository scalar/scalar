import type { Spec } from '@scalar/oas-utils'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'

/**
 * Returns all models from the specification, no matter if it’s Swagger 2.0 or OpenAPI 3.x.
 */
export function getModels(spec?: Spec) {
  if (!spec) {
    return {} as Record<string, OpenAPIV3_1.SchemaObject>
  }

  return (
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
  )
}
