import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getRefName } from './get-ref-name'

/**
 * Extract schema name from various schema formats
 *
 * Handles $ref, title, name, type, and schema dictionary lookup
 */
export const getModelNameFromSchema = (
  schemaOrRef: SchemaObject | SchemaReferenceType<SchemaObject>,
): string | null => {
  if (!schemaOrRef) {
    return null
  }

  if ('$ref' in schemaOrRef) {
    // Grab the name of the schema from the ref path
    const refName = getRefName(schemaOrRef.$ref)
    if (refName) {
      return refName
    }
  }

  const schema = resolve.schema(schemaOrRef)

  // Direct title/name properties - use direct property access for better performance
  if (schema.title) {
    return schema.title
  }

  if (schema.name) {
    return schema.name
  }

  return null
}

/**
 * Format the type and model name for display
 */
const formatTypeWithModel = (type: Extract<SchemaObject, { type: any }>['type'], modelName: string): string =>
  `${type} ${modelName}${type === 'array' ? '[]' : ''}`

/**
 * Get the model name for a schema property
 * e.g. User | Admin | array of User | array of Admin
 */
export const getModelName = (value: SchemaObject, hideModelNames = false): string | null => {
  if (!('type' in value) || hideModelNames) {
    return null
  }

  const valueType = value.type

  // First check if the entire schema matches a component schema
  const modelName = getModelNameFromSchema(value)
  if (modelName && value.title) {
    return valueType === 'array' ? `array ${modelName}[]` : modelName
  }

  // Handle array types with item references only if no full schema match was found
  if (isArraySchema(value) && value.items) {
    const items = resolve.schema(value.items)

    // Handle title/name
    const itemName = items.title
    if (itemName) {
      return formatTypeWithModel(valueType, itemName)
    }

    // Use the model name from the original reference
    const itemModelName = getModelNameFromSchema(items)
    if (itemModelName && 'type' in items && itemModelName !== items.type) {
      return formatTypeWithModel(valueType, itemModelName)
    }

    // Use the type
    if ('type' in items) {
      return formatTypeWithModel(valueType, Array.isArray(items.type) ? items.type.join(' | ') : items.type)
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
