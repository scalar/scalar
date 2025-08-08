import { getRefName } from './get-ref-name'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Extract schema name from various schema formats
 *
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export const getModelNameFromSchema = (schema: OpenAPIV3_1.SchemaObject): string | null => {
  if (!schema) {
    return null
  }

  // Direct title/name properties - use direct property access for better performance
  if (schema.title) {
    return schema.title
  }

  if (schema.name) {
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
export const formatTypeWithModel = (type: string, modelName: string): string =>
  `${type} ${modelName}${type === 'array' ? '[]' : ''}`

/**
 * Get the model name for a schema property
 * e.g. User | Admin | array of User | array of Admin
 */
export const getModelName = (value: Record<string, any>, hideModelNames = false): string | null => {
  if (!value?.type || hideModelNames) {
    return null
  }

  const valueType = value.type

  // First check if the entire schema matches a component schema
  const modelName = getModelNameFromSchema(value)
  if (modelName && (value.title || value.name)) {
    return valueType === 'array' ? `array ${modelName}[]` : modelName
  }

  // Handle array types with item references only if no full schema match was found
  if (valueType === 'array' && value.items) {
    const items = value.items

    // Handle title/name
    const itemName = items.title || items.name
    if (itemName) {
      return formatTypeWithModel(valueType, itemName)
    }

    // Use the model name
    const itemModelName = getModelNameFromSchema(items)
    if (itemModelName && itemModelName !== items.type) {
      return formatTypeWithModel(valueType, itemModelName)
    }

    // Use the type
    if (items.type) {
      return formatTypeWithModel(valueType, items.type)
    }

    return formatTypeWithModel(valueType, 'object')
  }

  if (modelName && modelName !== valueType) {
    if (modelName.startsWith('Array of ')) {
      // Use more efficient string replacement for known pattern
      const itemType = modelName.slice(9)
      return `array ${itemType}[]`
    }
    return modelName
  }

  return null
}
