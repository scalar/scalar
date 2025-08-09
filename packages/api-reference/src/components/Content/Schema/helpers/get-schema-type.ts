import { getRefName } from '@/components/Content/Schema/helpers/get-ref-name'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/**
 * Formats an array type string with proper wrapping for union types.
 */
const formatArrayType = (itemType: string): string => {
  if (!itemType) {
    return 'array'
  }

  const wrappedItemType = itemType.includes(' | ') ? `(${itemType})` : itemType
  return `array ${wrappedItemType}[]`
}

/**
 * Handles array type processing for both single array types and union types containing array.
 */
const processArrayType = (value: SchemaObject, isUnionType: boolean = false): string => {
  if (!value.items) {
    return isUnionType ? 'array' : value.title || value.xml?.name || 'array'
  }

  const itemType = getSchemaType(value.items)
  const baseType = formatArrayType(itemType)

  if (isUnionType) {
    return baseType
  }

  // Handle nullable arrays for non-union types
  return value.nullable ? `${baseType} | null` : baseType
}

/**
 * Computes the human-readable type for a schema.
 *
 * Priority order:
 * 1. const values
 * 2. Array types (with special handling for items)
 * 3. title property
 * 4. xml.name property
 * 5. type with contentEncoding
 * 6. $ref names
 * 7. raw type
 */
export const getSchemaType = (value: SchemaObject): string => {
  // Early return for falsy values
  if (!value) {
    return ''
  }

  // Handle const values first (highest priority)
  if (value.const !== undefined) {
    return 'const'
  }

  // Handle union types (array of types)
  if (Array.isArray(value.type)) {
    // Special case: union types containing 'array'
    if (value.type.includes('array') && value.items) {
      const arrayType = processArrayType(value, true)
      const otherTypes = value.type.filter((t) => t !== 'array')

      return otherTypes.length > 0 ? `${arrayType} | ${otherTypes.join(' | ')}` : arrayType
    }

    // Regular union types
    return value.type.join(' | ')
  }

  // Handle single array type
  if (value.type === 'array') {
    return processArrayType(value, false)
  }

  // Handle named schemas (title has highest priority)
  if (value.title) {
    return value.title
  }

  // Handle XML-named schemas
  if (value.xml?.name) {
    return value.xml.name
  }

  // Handle type with content encoding
  if (value.type && value.contentEncoding) {
    return `${value.type} • ${value.contentEncoding}`
  }

  // Handle referenced schemas
  const refName = getRefName(value)
  if (refName) {
    return refName
  }

  // Fallback to raw type
  return value.type ?? ''
}
