import { resolve } from '@scalar/workspace-store/resolve'
import type { ReferenceType, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

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
    return 'array'
  }

  const itemType = getSchemaType(resolve.schema(value.items))
  const baseType = formatArrayType(itemType)

  if (isUnionType) {
    return baseType
  }

  // Handle nullable arrays for non-union types
  return (value as any).nullable ? `${baseType} | null` : baseType
}

/**
 * Computes the structural type for a schema.
 * This helper always returns type information, never schema titles or ref names.
 *
 * Priority order:
 * 1. const values
 * 2. Array types (with special handling for items)
 * 3. type with contentEncoding
 * 4. raw type
 */
export const getSchemaType = (valueOrRef: SchemaObject | ReferenceType<SchemaObject>): string => {
  // Early return for falsy values
  if (!valueOrRef) {
    return ''
  }

  const value = resolve.schema(valueOrRef)

  // Handle const values first (highest priority)
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

  // Handle type with content encoding
  if ('type' in value && value.type && value.contentEncoding) {
    return `${value.type} • ${value.contentEncoding}`
  }

  // Fallback to raw type
  return 'type' in value ? (value.type as string) : ''
}
