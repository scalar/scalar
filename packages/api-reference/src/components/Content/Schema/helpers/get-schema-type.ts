import { resolve } from '@scalar/workspace-store/resolve'
import type { ReferenceType, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/**
 * Formats an array type string in TS-style (type[] only, no "array " prefix).
 * Wraps in parentheses when the item type is a union (contains " | ") or already an array type (ends with "]").
 * No space between consecutive brackets.
 */
const formatArrayType = (itemType: string): string => {
  if (!itemType) {
    return 'unknown[]'
  }

  const needsParens = itemType.includes(' | ') || itemType.endsWith(']')
  const wrappedItemType = needsParens ? `(${itemType})` : itemType
  return `${wrappedItemType}[]`
}

/**
 * Handles array type processing for both single array types and union types containing array.
 */
const processArrayType = (value: Extract<SchemaObject, { type: 'array' }>, isUnionType: boolean = false): string => {
  if (!value.items) {
    return 'unknown[]'
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
 * Computes the human-readable structural type for a schema.
 * Always returns the type (string, object, array, etc.), never title or ref name.
 *
 * Priority order:
 * 1. const values
 * 2. Union types (array of types)
 * 3. Array types (with special handling for items)
 * 4. type with contentEncoding
 * 5. raw type
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

    // Regular union types (array with no items shown as unknown[] in TS-style)
    return value.type.map((t) => (t === 'array' ? 'unknown[]' : t)).join(' | ')
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
