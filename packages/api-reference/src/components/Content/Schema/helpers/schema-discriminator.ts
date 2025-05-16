import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export type DiscriminatorMapping = {
  [key: string]: string
}

/** Discriminator */
export type DiscriminatorType = 'oneOf' | 'anyOf' | 'allOf' | 'not'

export const discriminators: DiscriminatorType[] = ['oneOf', 'anyOf', 'allOf', 'not']

/** Get discriminator mapping from schema - used in testing */
export function getDiscriminatorMapping(
  schema: OpenAPIV3_1.SchemaObject,
  discriminator: DiscriminatorType,
): DiscriminatorMapping | undefined {
  if (!schema[discriminator] || !Array.isArray(schema[discriminator])) {
    return undefined
  }

  const schemas = schema[discriminator] as OpenAPIV3_1.SchemaObject[]
  const mapping: DiscriminatorMapping = {}

  for (const s of schemas) {
    if (s.title) {
      mapping[s.title] = s.title
    } else if (s.type === 'object' && s.properties) {
      const typeProp = s.properties.type
      if (typeProp && 'enum' in typeProp && Array.isArray(typeProp.enum)) {
        const typeValue = typeProp.enum[0]
        if (typeof typeValue === 'string') {
          mapping[typeValue] = s.title || typeValue
        }
      }
    }
  }

  return Object.keys(mapping).length > 0 ? mapping : undefined
}

/** Get discriminator property name from schema */
export function getDiscriminatorPropertyName(schema: OpenAPIV3_1.SchemaObject): string | undefined {
  return schema.discriminator?.propertyName
}

/** Check if schema has a discriminator */
export function hasDiscriminator(schema: OpenAPIV3_1.SchemaObject): boolean {
  return discriminators.some((d) => schema[d] !== undefined)
}
