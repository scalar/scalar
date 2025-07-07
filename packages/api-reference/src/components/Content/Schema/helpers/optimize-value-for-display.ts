import type { UnknownObject } from '@scalar/types/utils'
import { mergeAllOfSchemas } from './merge-all-of-schemas'
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

  // Process schemas to merge allOf and handle nulls
  const processedSchemas = schemas.map((schema: any) => {
    // If this schema has allOf, merge it
    if (schema.allOf && Array.isArray(schema.allOf)) {
      const mergedSchema = mergeAllOfSchemas(schema.allOf)

      // Preserve all non-composition properties from the original schema
      Object.keys(schema).forEach((key) => {
        if (!compositions.includes(key as CompositionKeyword) && !(key in mergedSchema)) {
          mergedSchema[key] = schema[key]
        }
      })

      return mergedSchema
    }
    return schema
  })

  // If there's an object with type 'null' in the anyOf, oneOf, allOf, mark the property as nullable
  if (processedSchemas.some((schema: any) => schema.type === 'null')) {
    newValue.nullable = true
  }

  // Remove objects with type 'null' from the schemas
  const newSchemas = processedSchemas.filter((schema: any) => !(schema.type === 'null'))

  // If there's only one schema, overwrite the original value with the schema
  // Skip it for arrays for now, need to handle that specifically.
  if (newSchemas.length === 1 && newValue?.[composition]) {
    newValue = { ...newValue, ...newSchemas[0] }

    // Delete the original composition keyword
    delete newValue?.[composition]

    return newValue
  }

  // Overwrite the original schemas with the new schemas
  if (Array.isArray(newValue?.[composition]) && newValue?.[composition]?.length > 1) {
    newValue[composition] = newSchemas
  }

  return newValue
}
