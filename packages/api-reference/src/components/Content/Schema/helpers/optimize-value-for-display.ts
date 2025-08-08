import type { UnknownObject } from '@scalar/types/utils'
import type { CompositionKeyword } from './schema-composition'

export const compositions: CompositionKeyword[] = ['oneOf', 'anyOf', 'allOf', 'not']

/**
 * Optimize the value by removing nulls from compositions.
 */
export function optimizeValueForDisplay(value: UnknownObject | undefined): Record<string, any> | undefined {
  if (!value || typeof value !== 'object') {
    return value
  }

  // Clone the value to avoid mutating the original value
  let newValue = { ...value }

  // Find the composition keyword
  const composition = compositions.find((keyword) => newValue?.[keyword])

  // If there's no composition keyword, return the original value
  if (!composition) {
    return newValue
  }

  // Ignore the 'not' composition keyword
  if (composition === 'not') {
    return newValue
  }

  // Get the schemas for the composition keyword
  const schemas = newValue?.[composition]

  if (!Array.isArray(schemas)) {
    return newValue
  }

  // Check if there are any root properties that should be merged into composition schemas
  const rootProperties = { ...newValue }
  delete rootProperties[composition]
  delete rootProperties.nullable

  const hasRootProperties = Object.keys(rootProperties).length > 0
  const shouldMergeRootProperties =
    (composition === 'oneOf' || composition === 'anyOf') &&
    (schemas.some((schema: any) => schema.allOf) || hasRootProperties)

  // If there's an object with type 'null' in the anyOf, oneOf, allOf, mark the property as nullable
  if (schemas.some((schema: any) => schema.type === 'null')) {
    newValue.nullable = true
  }

  // Remove objects with type 'null' from the schemas
  const newSchemas = schemas.filter((schema: any) => !(schema.type === 'null'))

  // If there's only one schema, overwrite the original value with the schema
  // Skip it for arrays for now, need to handle that specifically.
  if (newSchemas.length === 1 && newValue?.[composition]) {
    newValue = { ...newValue, ...newSchemas[0] }

    // Delete the original composition keyword
    delete newValue?.[composition]

    return newValue
  }

  // If we merged root properties, return the new structure
  if (shouldMergeRootProperties) {
    newValue = {
      [composition]: newSchemas,
    }

    // Preserve nullable if it was set
    if (newValue.nullable) {
      newValue.nullable = true
    }

    return newValue
  }

  // Overwrite the original schemas with the new schemas
  if (Array.isArray(newValue?.[composition]) && newValue?.[composition]?.length > 1) {
    newValue[composition] = newSchemas
  }

  return newValue
}
