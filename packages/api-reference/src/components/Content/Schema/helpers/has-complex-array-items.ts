import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/** Composition keywords that indicate complex schema structure */
const COMPOSITION_KEYWORDS = ['allOf', 'oneOf', 'anyOf'] as const

/**
 * Checks if a schema has object type (either explicit type: 'object' or has properties)
 */
const isObjectType = (schema: SchemaObject): boolean => {
  // Check for explicit object type
  if ('type' in schema && schema.type) {
    if (Array.isArray(schema.type)) {
      return schema.type.includes('object')
    }
    return schema.type === 'object'
  }

  // Check for properties (implicit object type)
  return 'properties' in schema
}

/**
 * Checks if a schema has complex features (refs, compositions, discriminators)
 */
const hasComplexFeatures = (schema: SchemaObject): boolean =>
  '$ref' in schema || 'discriminator' in schema || COMPOSITION_KEYWORDS.some((keyword) => keyword in schema)

/**
 * Checks if nested array items are complex
 */
const hasComplexNestedArrayItems = (items: SchemaObject): boolean => {
  if (!isArraySchema(items) || typeof items.items !== 'object') {
    return false
  }

  // Check for $ref in original nested items before resolving
  if ('$ref' in items.items) {
    return true
  }

  const nestedItems = getResolvedRef(items.items)
  if (!nestedItems) {
    return false
  }

  // Check if nested items are complex (objects, refs, compositions, or further nested arrays)
  return isObjectType(nestedItems) || hasComplexFeatures(nestedItems) || isArraySchema(nestedItems)
}

/**
 * Checks if array items have complex structure
 * like: objects, references, discriminators, compositions, or nested arrays with complex items
 *
 * @param value - The schema object to check
 * @returns true if the array has complex items, false otherwise
 */
export const hasComplexArrayItems = (value: SchemaObject | undefined): boolean => {
  // Early return for invalid inputs
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return false
  }

  // Check for $ref in original items before resolving (in case ref can't be resolved)
  if ('$ref' in value.items) {
    return true
  }

  const items = getResolvedRef(value.items)
  if (!items) {
    return false
  }

  // Check for complex features (refs, compositions, discriminators)
  if (hasComplexFeatures(items)) {
    return true
  }

  // Check if items are objects
  if (isObjectType(items)) {
    return true
  }

  // Check if items are nested arrays with complex items
  return hasComplexNestedArrayItems(items)
}
