import { getRefName } from './get-ref-name'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Extract schema name from various schema formats
 *
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

  // Grab the name of the schema from the ref path
  const refName = getRefName(schema)
  if (refName) {
    return refName
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
export function getModelName(value: Record<string, any>, hideModelNames = false): string | null {
  if (!value?.type) {
    return null
  }

  if (hideModelNames) {
    return null
  }

  // First check if the entire schema matches a component schema
  const modelName = getModelNameFromSchema(value)
  if (modelName && (value.title || value.name)) {
    return value.type === 'array' ? `array ${modelName}[]` : modelName
  }

  // Handle array types with item references only if no full schema match was found
  if (value.type === 'array' && value.items) {
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
