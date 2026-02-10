import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getRefName } from './get-ref-name'

/**
 * Extract schema title from various schema formats.
 * Uses resolved schema title (JSON Schema) or $ref name when no title.
 */
export const getModelTitleFromSchema = (
  schemaOrRef: SchemaObject | SchemaReferenceType<SchemaObject>,
): string | null => {
  if (!schemaOrRef) {
    return null
  }

  const schema = resolve.schema(schemaOrRef)

  if (schema?.title) {
    return schema.title
  }

  if ('$ref' in schemaOrRef) {
    const refName = getRefName(schemaOrRef.$ref)
    if (refName) {
      return refName
    }
  }

  return null
}

/**
 * Format the type and model title for display
 */
const formatTypeWithModel = (type: Extract<SchemaObject, { type: any }>['type'], modelTitle: string): string =>
  `${type} ${modelTitle}${type === 'array' ? '[]' : ''}`

/**
 * Get the model title for a schema property
 * e.g. User | Admin | array of User | array of Admin
 */
export const getModelTitle = (value: SchemaObject, hideModelTitles = false): string | null => {
  if (!('type' in value) || hideModelTitles) {
    return null
  }

  const valueType = value.type

  // First check if the entire schema matches a component schema
  const modelTitle = getModelTitleFromSchema(value)
  if (modelTitle && value.title) {
    return valueType === 'array' ? `array ${modelTitle}[]` : modelTitle
  }

  // Handle array types with item references only if no full schema match was found
  if (isArraySchema(value) && value.items) {
    const items = resolve.schema(value.items)

    const itemTitle = items.title
    if (itemTitle) {
      return formatTypeWithModel(valueType, itemTitle)
    }

    const itemModelTitle = getModelTitleFromSchema(items)
    if (itemModelTitle && 'type' in items && itemModelTitle !== items.type) {
      return formatTypeWithModel(valueType, itemModelTitle)
    }

    if ('type' in items) {
      return formatTypeWithModel(valueType, Array.isArray(items.type) ? items.type.join(' | ') : items.type)
    }

    return formatTypeWithModel(valueType, 'object')
  }

  if (modelTitle && modelTitle !== valueType) {
    if (modelTitle.startsWith('Array of ')) {
      const itemType = modelTitle.slice(9)
      return `array ${itemType}[]`
    }
    return modelTitle
  }

  return null
}
