import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

/** Helper function create an OpenAPI document with security schemss */
export function createOpenAPIDocument(
  securitySchemes: Record<
    string,
    OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject
  >,
): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    components: { securitySchemes },
  }
}
