import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Computes the human-readable type for a schema.
 **/
export const getSchemaType = (value: OpenAPIV3_1.SchemaObject): string => {
  if (Array.isArray(value?.type)) {
    // Handle array types that include 'array' - we need to process items
    if (value.type.includes('array') && value.items) {
      const itemType = getSchemaType(value.items)
      const wrappedItemType = itemType && itemType.includes(' | ') ? `(${itemType})` : itemType
      const baseType = itemType ? `array ${wrappedItemType}[]` : 'array'

      // Remove 'array' from the type array and join the rest
      const otherTypes = value.type.filter((t) => t !== 'array')
      if (otherTypes.length > 0) {
        return `${baseType} | ${otherTypes.join(' | ')}`
      }

      return baseType
    }

    return value.type.join(' | ')
  }

  // Handle array schemas with items
  if (value?.type === 'array' && value.items) {
    const itemType = getSchemaType(value.items)
    const wrappedItemType = itemType && itemType.includes(' | ') ? `(${itemType})` : itemType
    const baseType = itemType ? `array ${wrappedItemType}[]` : 'array'

    // Handle nullable arrays
    if (value.nullable) {
      return `${baseType} | null`
    }

    return baseType
  }

  if (value?.title) {
    return value.title
  }

  if (value?.name) {
    return value.name
  }

  if (value?.type && value.contentEncoding) {
    return `${value.type} • ${value.contentEncoding}`
  }

  return value?.type ?? ''
}
