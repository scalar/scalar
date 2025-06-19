import type { Schemas } from '@/features/Operation/types/schemas'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'

/**
 * Extract schema name from various schema formats
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export function getModelNameFromSchema(schema: OpenAPIV3_1.SchemaObject): string | null {
  if (!schema) {
    return null
  }

  // Direct title/name properties
  if ('title' in schema && schema.title) {
    return schema.title
  }

  if ('name' in schema && schema.name) {
    return schema.name
  }

  // Handle $ref schemas - extract name from reference path
  // e.g. SchemaName for #/components/schemas/SchemaName
  if ('$ref' in schema) {
    const refPath = schema.$ref
    const match = refPath.match(/\/([^\/]+)$/)
    if (match) {
      return match[1]
    }
  }

  // Handle array types with items
  if ('type' in schema && schema.type === 'array' && 'items' in schema && schema.items) {
    const itemType = ('type' in schema.items && schema.items.type) || 'any'

    return `Array of ${itemType}`
  }

  // Fallback to type
  if ('type' in schema && schema.type) {
    return Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type
  }

  // Last resort: use first object key
  if (typeof schema === 'object') {
    const keys = Object.keys(schema)
    if (keys.length > 0) {
      return keys[0]
    }
  }

  return null
}

/**
 * Find schema name by matching against component schemas
 */
export function getSchemaNameFromSchemas(schema: OpenAPIV3_1.SchemaObject, schemas?: Schemas): string | null {
  // We only want to use this strategy for arrays or objects
  if (!schema || !schemas || typeof schemas !== 'object' || (schema.type !== 'array' && schema.type !== 'object')) {
    return null
  }

  for (const [schemaName, schemaValue] of Object.entries(schemas)) {
    if (schemaValue.type === schema.type) {
      if (schema.type === 'array' && schemaValue.items?.type === schema.items?.type) {
        return schemaName
      }

      if (
        schema.type === 'object' &&
        schemaValue.properties &&
        schema.properties &&
        stringify(schemaValue.properties) === stringify(schema.properties)
      ) {
        return schemaName
      }
    }
  }

  return null
}

/**
 * Format the type and model name for display
 */
export function formatTypeWithModel(type: string, modelName: string): string {
  return type === 'array' ? `${type} ${modelName}[]` : `${type} ${modelName}`
}

/**
 * Get the model name for a schema property
 * e.g. User | Admin | array of User | array of Admin
 */
export function getModelName(
  value: Record<string, any>,
  schemas?: Schemas,
  hideModelNames = false,
  getDiscriminatorSchemaName?: (schema: any, schemas?: Schemas) => string | null,
): string | null {
  if (!value?.type) {
    return null
  }

  if (hideModelNames) {
    if (value.type === 'array' && value.items?.type) {
      return `array ${value.items.type}[]`
    }
    return null
  }

  // First check if the entire schema matches a component schema
  const modelName = getModelNameFromSchema(value)
  if (modelName && (value.title || value.name)) {
    return value.type === 'array' ? `array ${modelName}[]` : modelName
  }

  const schemaName = getSchemaNameFromSchemas(value, schemas)
  if (schemaName) {
    return value.type === 'array' ? `array ${schemaName}[]` : schemaName
  }

  // Handle array types with item references only if no full schema match was found
  if (value.type === 'array' && value.items) {
    // Check if items reference a discriminator schema
    if (getDiscriminatorSchemaName) {
      const baseSchemaName = getDiscriminatorSchemaName(value.items, schemas)
      if (baseSchemaName) {
        return formatTypeWithModel(value.type, baseSchemaName)
      }
    }

    // Handle title/name
    if (value.items.title || value.items.name) {
      return formatTypeWithModel(value.type, value.items.title || value.items.name)
    }

    const itemModelName = getModelNameFromSchema(value.items)
    if (itemModelName && itemModelName !== value.items.type) {
      return formatTypeWithModel(value.type, itemModelName)
    }

    if (value.items.type) {
      return formatTypeWithModel(value.type, value.items.type)
    }

    return formatTypeWithModel(value.type, 'object')
  }

  if (modelName && modelName !== value.type) {
    if (modelName.startsWith('Array of ')) {
      const itemType = modelName.replace('Array of ', '')
      return `array ${itemType}[]`
    }
    return modelName
  }

  return null
}

/**
 * Check if a schema has a name (title, name, or custom identifier)
 */
export function hasName(name: string | null): boolean {
  if (!name) {
    return false
  }

  // Exclude composition keywords
  const compositionKeywords = ['anyOf', 'oneOf', 'allOf']
  if (compositionKeywords.includes(name)) {
    return false
  }

  // Consider has having a name if it:
  // - Has capital letters (PascalCase, camelCase)
  // - Contains spaces (like "User Profile")
  // - Has numbers with letters (like "foo (1)")
  return /[A-Z]/.test(name) || /\s/.test(name) || /\(\d+\)/.test(name)
}

/**
 * Choose the schemas to display in composition panel
 */
export function getCompositionDisplay(
  baseSchemas: OpenAPIV3_1.SchemaObject[],
  compositionSchemas: OpenAPIV3_1.SchemaObject[],
  schemas?: Schemas,
): OpenAPIV3_1.SchemaObject[] {
  // If base schemas have $ref, always use them to preserve $ref information
  if (baseSchemas.some((schema) => '$ref' in schema)) {
    return baseSchemas
  }

  // Check if base schemas have names
  const baseNames = baseSchemas.map((schema) => getModelNameFromSchema(schema))
  const baseHasName = baseNames.some((name) => hasName(name))

  // If base schemas have names, use them
  if (baseHasName) {
    return baseSchemas
  }

  // Check if composition schemas have names
  const compositionNames = compositionSchemas.map((schema) => getModelNameFromSchema(schema))
  const compositionHasName = compositionNames.some((name) => hasName(name))

  // If composition schemas have names but original don't, use composition
  if (compositionHasName) {
    return compositionSchemas
  }

  // Default to base schemas
  return baseSchemas
}
