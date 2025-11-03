import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

/** Helper function create an OpenAPI document with security schemss */
export function createOpenApiDefinition(
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject>,
): OpenAPIV3_1.Document {
  return {
    openapi: '3.1.1',
    info: { title: 'Test API', version: '1.0.0' },
    components: { securitySchemes },
  }
}
