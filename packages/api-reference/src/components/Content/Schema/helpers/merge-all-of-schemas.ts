import type { OpenAPI } from '@scalar/openapi-types'

type SchemaObject = OpenAPI.SchemaObject

/**
 * Merges multiple OpenAPI schema objects into a single schema object.
 * Handles nested allOf compositions and merges properties recursively.
 *
 * @param schemas - Array of OpenAPI schema objects to merge
 * @returns Merged schema object
 */
export function mergeAllOfSchemas(schemas: Record<string, any>[]): Record<string, any> {
  // Handle empty or invalid input
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return {}
  }

  // Merge all schemas into a single object
  return schemas.reduce((result: Record<string, any>, schema) => {
    if (!schema || typeof schema !== 'object') {
      return result
    }

    // Handle nested allOf case first
    if (schema.allOf) {
      const mergedNestedSchema: Record<string, any> = mergeAllOfSchemas(schema.allOf)
      return mergeAllOfSchemas([result, mergedNestedSchema])
    }

    const mergedResult = { ...result }

    // Merge properties if they exist
    if (schema.properties) {
      mergedResult.properties = mergeProperties(mergedResult.properties || {}, schema.properties)
    }

    // Handle items property
    if (schema.items) {
      mergedResult.items = mergeArrayItems(mergedResult.items || {}, schema.items)
    }

    // Merge other schema attributes
    return mergeSchemaAttributes(mergedResult, schema)
  }, {})
}

/**
 * Merges two sets of schema properties recursively
 */
function mergeProperties(existingProps: Record<string, any>, newProps: Record<string, any>): Record<string, any> {
  const merged = { ...existingProps }

  Object.entries(newProps).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') {
      merged[key] = value
      return
    }

    if (!merged[key]) {
      // Handle array items with allOf
      if (value.type === 'array' && value.items?.allOf) {
        merged[key] = {
          ...value,
          items: mergeAllOfSchemas(value.items.allOf),
        }
      } else if (value.allOf) {
        // Handle direct allOf in property
        merged[key] = mergeAllOfSchemas(value.allOf)
      } else {
        merged[key] = value
      }
      return
    }

    // Merge existing property with new value
    if (value.allOf) {
      // If the new value has allOf, merge it with the existing property
      merged[key] = mergeAllOfSchemas([merged[key], ...value.allOf])
    } else if (value.type === 'array' && value.items) {
      // Handle array type properties
      merged[key] = {
        ...merged[key],
        type: 'array',
        items: mergeArrayItems(merged[key].items || {}, value.items),
      }
    } else {
      // For regular objects, merge properties recursively first
      const mergedProperties =
        merged[key].properties || value.properties
          ? mergeProperties(merged[key].properties || {}, value.properties || {})
          : undefined

      merged[key] = {
        ...merged[key],
        ...value,
      }

      // Ensure properties are not overwritten by the spread
      if (mergedProperties) {
        merged[key].properties = mergedProperties
      }
    }
  })

  return merged
}

/**
 * Merges array items schemas
 */
function mergeArrayItems(existing: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  // Handle allOf in either schema
  if (existing.allOf || incoming.allOf) {
    const allOfSchemas = [...(existing.allOf || [existing]), ...(incoming.allOf || [incoming])]
    return mergeAllOfSchemas(allOfSchemas)
  }

  // Regular merge for non-allOf items
  const merged = {
    ...existing,
    ...incoming,
  }

  // Recursively merge properties
  if (merged.properties || incoming.properties) {
    merged.properties = mergeProperties(merged.properties || {}, incoming.properties || {})
  }

  return merged
}

/**
 * Merges non-property schema attributes
 */
const mergeSchemaAttributes = (target: SchemaObject, source: SchemaObject): SchemaObject => {
  const merged = typeof target === 'object' ? { ...target } : {}

  // Merge required fields
  if (source.required && Array.isArray(source.required)) {
    merged.required = [...(target.required || []), ...source.required]
  }

  // Copy type if not already set
  if (source.type && !target.type) {
    merged.type = source.type
  }

  // Copy description if not already set
  if (source.description && !target.description) {
    merged.description = source.description
  }

  return merged
}
