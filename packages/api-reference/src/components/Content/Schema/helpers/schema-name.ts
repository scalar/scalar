import { stringify } from 'flatted'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Schemas } from '@/features/Operation/types/schemas'

/**
 * Extract schema name from various schema formats
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export function getModelNameFromSchema(schema: OpenAPIV3_1.SchemaObject, schemas?: Schemas): string | null {
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

  // Schema dictionary lookup by comparing stringified objects
  if (schemas && typeof schemas === 'object') {
    for (const [schemaName, schemaValue] of Object.entries(schemas)) {
      // To avoid circular references, stringify the schema and compare
      if (stringify(schemaValue) === stringify(schema)) {
        return schemaName
      }
    }
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
  const baseNames = baseSchemas.map((schema) => getModelNameFromSchema(schema, schemas))
  const baseHasName = baseNames.some((name) => hasName(name))

  // If base schemas have names, use them
  if (baseHasName) {
    return baseSchemas
  }

  // Check if composition schemas have names
  const compositionNames = compositionSchemas.map((schema) => getModelNameFromSchema(schema, schemas))
  const compositionHasName = compositionNames.some((name) => hasName(name))

  // If composition schemas have names but original don't, use composition
  if (compositionHasName) {
    return compositionSchemas
  }

  // Default to base schemas
  return baseSchemas
}
