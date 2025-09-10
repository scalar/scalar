import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { compositions } from './schema-composition'

/**
 * Optimize the value by removing nulls from compositions and merging root properties.
 *
 * TODO: figure out what this does
 */
export function optimizeValueForDisplay(value: SchemaObject | undefined): SchemaObject | undefined {
  if (!value || typeof value !== 'object') {
    return value
  }

  // Find the composition keyword early to avoid unnecessary work
  const composition = compositions.find((keyword) => keyword in value && keyword !== 'not')

  // If there's no relevant composition keyword, return a shallow copy
  if (!composition) {
    return { ...value }
  }

  const schemas = value[composition]
  if (!Array.isArray(schemas)) {
    return { ...value }
  }

  // Extract root properties efficiently (excluding composition and nullable)
  const { [composition]: _, nullable: originalNullable, ...rootProperties } = value as any
  const hasRootProperties = Object.keys(rootProperties).length > 0

  // Check for null schemas and filter them out in one pass
  const { filteredSchemas, hasNullSchema } = schemas.reduce(
    (acc: { filteredSchemas: SchemaObject[]; hasNullSchema: boolean }, _schema) => {
      const schema = getResolvedRef(_schema)

      if ('type' in schema && schema.type === 'null') {
        acc.hasNullSchema = true
      } else {
        acc.filteredSchemas.push(schema)
      }
      return acc
    },
    { filteredSchemas: [] as SchemaObject[], hasNullSchema: false },
  )

  // Determine if nullable should be set
  const shouldBeNullable = hasNullSchema || originalNullable === true

  // If only one schema remains after filtering, merge with root properties
  if (filteredSchemas.length === 1) {
    const mergedSchema = { ...rootProperties, ...filteredSchemas[0] }
    if (shouldBeNullable) {
      // @ts-ignore
      mergedSchema.nullable = true
    }
    return mergedSchema
  }

  // Check if root properties should be merged into schemas
  const shouldMergeRootProperties =
    (composition === 'oneOf' || composition === 'anyOf') &&
    (hasRootProperties || filteredSchemas.some((schema: SchemaObject) => schema.allOf))

  if (shouldMergeRootProperties) {
    const mergedSchemas = filteredSchemas.map((_schema: SchemaObject) => {
      const schema = getResolvedRef(_schema)

      // Flatten single-item allOf and merge with root properties
      if (schema.allOf?.length === 1) {
        const { allOf, ...otherProps } = schema
        return { ...rootProperties, ...otherProps, ...getResolvedRef(allOf[0]) }
      }
      return { ...rootProperties, ...schema }
    })

    // @ts-expect-error - We avoid using coerceValue here as it may be dangerous, so we type cast
    const result = { [composition]: mergedSchemas } as SchemaObject
    if (shouldBeNullable) {
      // @ts-ignore We use nullable
      result.nullable = true
    }
    return result
  }

  // Return with filtered schemas if any nulls were removed
  if (filteredSchemas.length !== schemas.length) {
    const result: SchemaObject = { ...value, [composition]: filteredSchemas }
    if (shouldBeNullable) {
      // @ts-ignore We use nullable
      result.nullable = true
    }
    return result
  }

  return { ...value }
}
