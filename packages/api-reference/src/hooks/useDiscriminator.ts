import type { Schemas } from '@/features/Operation/types/schemas'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { computed, ref, watch, type InjectionKey, type ComputedRef } from 'vue'

/** Discriminator context type */
export type DiscriminatorContext = {
  selectedType: string | undefined
  discriminatorMapping: Record<string, string>
  discriminatorPropertyName: string
  hasDiscriminator: boolean
  mergedSchema: OpenAPIV3_1.SchemaObject | undefined
}

/** Example context type */
export type ExampleContext = {
  generateExampleValue: (isArray?: boolean) => any
}

/** Injection keys */
export const DISCRIMINATOR_CONTEXT = Symbol('discriminator-context') as InjectionKey<
  ComputedRef<DiscriminatorContext | null>
>
export const EXAMPLE_CONTEXT = Symbol('example-context') as InjectionKey<ExampleContext>

/** Discriminator mapping */
export type DiscriminatorMapping = NonNullable<OpenAPIV3_1.DiscriminatorObject['mapping']>

/** Discriminator property name */
export type DiscriminatorPropertyName = OpenAPIV3_1.DiscriminatorObject['propertyName']

/** Use discriminator options */
export type UseDiscriminatorOptions = {
  schema: OpenAPIV3_1.SchemaObject | undefined
  schemas?: Schemas
  onSchemaChange?: (newSchema: OpenAPIV3_1.SchemaObject) => void
}

/** Get discriminator mapping from schema */
export function getDiscriminatorMapping(
  schema: OpenAPIV3_1.SchemaObject | undefined,
): DiscriminatorMapping | undefined {
  if (!schema?.discriminator?.mapping) {
    return undefined
  }
  return schema.discriminator.mapping
}

/** Get discriminator property name from schema */
export function getDiscriminatorPropertyName(
  schema: OpenAPIV3_1.SchemaObject | undefined,
): DiscriminatorPropertyName | undefined {
  return schema?.discriminator?.propertyName
}

/** Check if schema has a discriminator */
export function hasDiscriminator(schema: OpenAPIV3_1.SchemaObject | undefined): boolean {
  return schema?.discriminator !== undefined
}

/** Get base discriminator schema name by matching discriminator property */
export function getBaseDiscriminatorSchemaName(discriminatorPropertyName: string, schemas?: Schemas): string | null {
  if (!schemas) {
    return null
  }

  for (const [schemaName, schemaValue] of Object.entries(schemas)) {
    if (
      typeof schemaValue === 'object' &&
      schemaValue !== null &&
      'discriminator' in schemaValue &&
      schemaValue.discriminator?.propertyName === discriminatorPropertyName
    ) {
      return schemaName
    }
  }

  return null
}

/** Get base discriminator schema name for array items that might reference a discriminator schema */
export function getDiscriminatorSchemaName(
  itemsSchema: OpenAPIV3_1.SchemaObject | undefined,
  schemas?: Schemas,
): string | null {
  if (!itemsSchema || !schemas || itemsSchema.type !== 'object' || !itemsSchema.properties) {
    return null
  }

  // Look for schemas that have discriminators and check if the items schema
  for (const [schemaName, schemaValue] of Object.entries(schemas)) {
    if (
      typeof schemaValue === 'object' &&
      schemaValue !== null &&
      'discriminator' in schemaValue &&
      schemaValue.discriminator?.propertyName
    ) {
      const discriminatorProp = schemaValue.discriminator.propertyName
      // Check if the items schema has the discriminator property
      if (itemsSchema.properties[discriminatorProp]) {
        return schemaName
      }
    }
  }

  return null
}

/** Get the target schema that might contain the discriminator */
function getTargetSchema(schema: OpenAPIV3_1.SchemaObject | undefined): OpenAPIV3_1.SchemaObject | undefined {
  if (!schema) {
    return undefined
  }

  // For arrays, look in the items
  if (schema.type === 'array' && schema.items && typeof schema.items === 'object' && !('$ref' in schema.items)) {
    return schema.items as OpenAPIV3_1.SchemaObject
  }

  return schema
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
      type: selectedSchema.type || 'object',
      properties: {},
      required: [],
      ...(baseSchema.title ? { title: baseSchema.title } : {}),
      ...(baseSchema.name ? { name: baseSchema.name } : {}),
    }
    const properties: Record<string, OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject> = {}
    const required = new Set<string>()

    // First add base schema required fields
    if (baseSchema.required) {
      baseSchema.required.forEach((field: string) => required.add(field))
    }

    // Then process all allOf schemas
    for (const subSchema of selectedSchema.allOf) {
      if ('$ref' in subSchema) {
        // Handle $ref - extract schema name and merge from schemas
        const refSchemaName = subSchema.$ref.split('/').pop()
        if (refSchemaName && schemas[refSchemaName]) {
          const refSchema = schemas[refSchemaName]
          if (refSchema.properties) {
            Object.assign(properties, refSchema.properties)
          }
          if (refSchema.required) {
            refSchema.required.forEach((field: string) => required.add(field))
          }
        }
      } else if ('properties' in subSchema) {
        Object.assign(properties, subSchema.properties)
        if ('required' in subSchema && Array.isArray(subSchema.required)) {
          subSchema.required.forEach((field: string) => required.add(field))
        }
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
    // Preserve discriminator
    discriminator: baseSchema.discriminator,
    // Preserve title and name from base schema
    ...(baseSchema.title ? { title: baseSchema.title } : {}),
    ...(baseSchema.name ? { name: baseSchema.name } : {}),
  } as OpenAPIV3_1.SchemaObject
}

/** Use discriminator hook */
export function useDiscriminator({ schema, schemas, onSchemaChange }: UseDiscriminatorOptions) {
  const targetSchema = computed(() => getTargetSchema(schema))

  /** Returns the discriminator mapping */
  const discriminatorMapping = computed(() => getDiscriminatorMapping(targetSchema.value))

  /** Returns the default discriminator type */
  const defaultType = computed(() => {
    if (!discriminatorMapping.value) {
      return ''
    }
    return Object.keys(discriminatorMapping.value)[0] || ''
  })

  const selectedType = ref<string>(defaultType.value)

  // Watch defaultType and update selectedType if it's not set yet
  watch(
    defaultType,
    (newDefaultType) => {
      if (newDefaultType && !selectedType.value) {
        selectedType.value = newDefaultType
      }
    },
    { immediate: true },
  )

  /** Returns the name of the discriminator property */
  const discriminatorPropertyName = computed(() => getDiscriminatorPropertyName(targetSchema.value))

  /** Returns whether the schema has a discriminator */
  const hasSchemaDiscriminator = computed(() => hasDiscriminator(targetSchema.value))

  /** Returns merged schema based on selected type */
  const mergedSchema = computed(() => {
    if (!targetSchema.value || !schemas || !selectedType.value) {
      return schema
    }

    const merged = mergeDiscriminatorSchemas(
      targetSchema.value,
      selectedType.value,
      schemas as Record<string, OpenAPIV3_1.SchemaObject>,
    )
    if (!merged) {
      return schema
    }

    // Create the final schema
    const newSchema: OpenAPIV3_1.SchemaObject =
      schema?.type === 'array'
        ? {
            type: 'array',
            items: merged,
            ...(schema.title ? { title: schema.title } : {}),
            ...(schema.name ? { name: schema.name } : {}),
          }
        : merged

    // Notify parent of schema change
    onSchemaChange?.(newSchema)

    return newSchema
  })

  /** Generate default value based on schema type */
  const generateDefaultValue = (schemaProp: OpenAPIV3_1.SchemaObject) => {
    if ('default' in schemaProp) {
      return schemaProp.default
    }
    if ('example' in schemaProp) {
      return schemaProp.example
    }

    switch (schemaProp.type) {
      case 'string':
        return ''
      case 'integer':
      case 'number':
        return schemaProp.nullable ? null : 0
      case 'boolean':
        return false
      case 'array':
        return []
      case 'object':
        return {}
      default:
        return null
    }
  }

  /** Generate example value for the selected type */
  const generateExampleValue = (isArray = false) => {
    if (!mergedSchema.value) {
      return isArray ? [] : {}
    }

    const baseProperties: Record<string, any> = {}

    // Get the actual schema to use for properties
    const schemaToUse =
      mergedSchema.value.type === 'array' ? (mergedSchema.value.items as OpenAPIV3_1.SchemaObject) : mergedSchema.value

    // Add properties from merged schema
    if ('properties' in schemaToUse && schemaToUse.properties) {
      Object.entries(schemaToUse.properties).forEach(([key, prop]) => {
        const schemaProp = prop as OpenAPIV3_1.SchemaObject
        if (schemaProp === null) {
          return
        }
        baseProperties[key] = generateDefaultValue(schemaProp)
      })
    }

    // If we have a discriminator, ensure the discriminator property is set
    if (discriminatorPropertyName.value && selectedType.value) {
      baseProperties[discriminatorPropertyName.value] = selectedType.value
    }

    // For array types, wrap in array
    const result = isArray ? [baseProperties] : baseProperties

    // Return stringified then parsed to remove undefined values
    return JSON.parse(JSON.stringify(result))
  }

  return {
    selectedType,
    discriminatorMapping,
    defaultType,
    discriminatorPropertyName,
    hasDiscriminator: hasSchemaDiscriminator,
    mergedSchema,
    generateExampleValue,
  }
}
