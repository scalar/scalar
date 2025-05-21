import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Get discriminator property name from schema */
export function getDiscriminatorPropertyName(schema: OpenAPIV3_1.SchemaObject): string | undefined {
  return schema.discriminator?.propertyName
}
