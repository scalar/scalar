import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/reference'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getRefName } from '@/components/Content/Schema/helpers/get-ref-name'

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
const processArrayType = (value: Extract<SchemaObject, { type: 'array' }>, isUnionType: boolean = false): string => {
  if (!value.items) {
    return isUnionType ? 'array' : value.title || value.xml?.name || 'array'
  }

  const itemType = getSchemaType(value.items)
  const baseType = formatArrayType(itemType)

  if (isUnionType) {
    return baseType
  }

  // Handle nullable arrays for non-union types
  return (value as any).nullable ? `${baseType} | null` : baseType
}

/**
 * Computes the human-readable type for a schema.
 *
 * Priority order:
 * 1. title property.
 * 2. Array types (with special handling for items)
 * 3. const values
 * 4. xml.name property
 * 5. type with contentEncoding
 * 6. $ref names
 * 7. raw type
 */
export const getSchemaType = (valueOrRef: SchemaObject | ReferenceType<SchemaObject>): string => {
  // Early return for falsy values
  if (!valueOrRef) {
    return ''
  }

  const value = getResolvedRef(valueOrRef)

  // Handle named schemas (title has highest priority for display)
  if (value.title) {
    return value.title
  }

  // Handle const values
  if (value.const !== undefined) {
    return 'const'
  }

  // Handle union types (array of types)
  if ('type' in value && Array.isArray(value.type)) {
    // Special case: union types containing 'array'
    // TODO: Correctly type array of types in SchemaObject
    if (value.type.includes('array') && (value as Extract<SchemaObject, { type: 'array' }>).items) {
      const arrayType = processArrayType(value as Extract<SchemaObject, { type: 'array' }>, true)
      const otherTypes = value.type.filter((t) => t !== 'array')

      return otherTypes.length > 0 ? `${arrayType} | ${otherTypes.join(' | ')}` : arrayType
    }

    // Regular union types
    return value.type.join(' | ')
  }

  // Handle single array type
  if (isArraySchema(value)) {
    return processArrayType(value, false)
  }

  // Handle XML-named schemas
  if (value.xml?.name) {
    return value.xml.name
  }

  // Handle type with content encoding
  if ('type' in value && value.type && value.contentEncoding) {
    return `${value.type} • ${value.contentEncoding}`
  }

  if ('$ref' in valueOrRef) {
    // Handle referenced schemas
    const refName = getRefName(valueOrRef)
    if (refName) {
      return refName
    }
  }

  // Fallback to raw type
  return 'type' in value ? (value.type as string) : ''
}
