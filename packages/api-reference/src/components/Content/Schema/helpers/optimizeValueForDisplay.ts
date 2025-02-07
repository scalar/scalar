import type { UnknownObject } from '@scalar/types/utils'

export const discriminators = ['oneOf', 'anyOf', 'allOf', 'not']

/**
 * Optimize the value by removing nulls from discriminators.
 */
export function optimizeValueForDisplay(
  value: UnknownObject | undefined,
): Record<string, any> | undefined {
  if (!value || typeof value !== 'object') {
    return value
  }

  // Clone the value to avoid mutating the original value
  let newValue = { ...value }

  // Find the discriminator type
  const discriminatorType = discriminators.find((r) => newValue?.[r])

  // If there’s no discriminator type, return the original value
  if (!discriminatorType) {
    return newValue
  }

  // Ignore the 'not' discriminator type
  if (discriminatorType === 'not') {
    return newValue
  }

  // Get the schemas for the discriminator type
  const schemas = newValue?.[discriminatorType]

  if (!Array.isArray(schemas)) {
    return newValue
  }

  // If there’s an object with type 'null' in the anyOf, oneOf, allOf, mark the property as nullable
  if (schemas.some((schema: any) => schema.type === 'null')) {
    newValue.nullable = true
  }

  // Remove objects with type 'null' from the schemas
  const newSchemas = schemas.filter((schema: any) => !(schema.type === 'null'))

  // If there’s only one schema, overwrite the original value with the schema
  // Skip it for arrays for now, need to handle that specifically.
  if (newSchemas.length === 1 && newValue?.[discriminatorType]) {
    newValue = { ...newValue, ...newSchemas[0] }

    // Delete the original discriminator type
    delete newValue?.[discriminatorType]

    return newValue
  }

  // Overwrite the original schemas with the new schemas
  if (
    Array.isArray(newValue?.[discriminatorType]) &&
    newValue?.[discriminatorType]?.length > 1
  ) {
    newValue[discriminatorType] = newSchemas
  }

  return newValue
}
