import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export type DiscriminatorMapping = NonNullable<OpenAPIV3_1.DiscriminatorObject['mapping']>

export type DiscriminatorPropertyName = OpenAPIV3_1.DiscriminatorObject['propertyName']

/** Get discriminator mapping from schema */
export function getDiscriminatorMapping(schema: OpenAPIV3_1.SchemaObject): DiscriminatorMapping | undefined {
  if (!schema.discriminator?.mapping) {
    return undefined
  }

  return schema.discriminator.mapping
}

/** Get discriminator property name from schema */
export function getDiscriminatorPropertyName(schema: OpenAPIV3_1.SchemaObject): DiscriminatorPropertyName | undefined {
  return schema.discriminator?.propertyName
}

/** Check if schema has a discriminator */
export function hasDiscriminator(schema: OpenAPIV3_1.SchemaObject): boolean {
  return schema.discriminator !== undefined
}

/** Merge discriminator schemas */
export function mergeDiscriminatorSchemas(
  baseSchema: OpenAPIV3_1.SchemaObject,
  selectedType: string,
  schemas: Record<string, OpenAPIV3_1.SchemaObject>,
): OpenAPIV3_1.SchemaObject | undefined {
  if (!baseSchema.discriminator?.mapping || !selectedType) {
    return undefined
  }

  const refPath = baseSchema.discriminator.mapping[selectedType]
  if (!refPath) {
    return undefined
  }

  // Extract schema name from ref path
  const schemaName = refPath.split('/').pop()
  if (!schemaName || !schemas[schemaName]) {
    return undefined
  }

  const selectedSchema = schemas[schemaName]

  // If the selected schema has allOf, merge all subschemas
  if (selectedSchema.allOf) {
    const mergedSchema: OpenAPIV3_1.SchemaObject = {
      type: selectedSchema.type,
      properties: {},
      required: [],
    }
    const properties: Record<string, OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject> = {}
    const required = new Set<string>()

    // First add base schema required fields
    if (baseSchema.required) {
      baseSchema.required.forEach((field: string) => required.add(field))
    }

    // Then process all allOf schemas
    for (const subSchema of selectedSchema.allOf) {
      if ('properties' in subSchema) {
        Object.assign(properties, subSchema.properties)
      }
      if ('required' in subSchema && Array.isArray(subSchema.required)) {
        subSchema.required.forEach((field: string) => required.add(field))
      }
    }

    mergedSchema.properties = properties
    mergedSchema.required = Array.from(required)

    return mergedSchema
  }

  // If no allOf, merge with base schema
  return {
    type: selectedSchema.type || baseSchema.type,
    properties: {
      ...(baseSchema.properties || {}),
      ...(selectedSchema.properties || {}),
    },
    required: [...(baseSchema.required || []), ...(selectedSchema.required || [])],
  } as OpenAPIV3_1.SchemaObject
}
