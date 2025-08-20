import { objectKeys } from '@scalar/helpers/object/object-keys'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/**
 * Merges multiple OpenAPI schema objects into a single schema object.
 * Handles nested allOf compositions and merges properties recursively.
 *
 * @param schemas - Array of OpenAPI schema objects to merge
 * @param rootSchema - Optional root schema to merge with the result
 * @returns Merged schema object
 */
export const mergeAllOfSchemas = (schemas: SchemaObject['allOf'], rootSchema?: SchemaObject): SchemaObject => {
  // Handle max depth, empty or invalid input
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return rootSchema || ({} as SchemaObject)
  }

  // Initialize result object once
  const result = {} as SchemaObject

  // Process schemas first, avoiding array spread
  for (const _schema of schemas) {
    if (!_schema || typeof _schema !== 'object') {
      continue
    }

    // Resolve ref if present
    const schema = getResolvedRef(_schema)

    // Handle nested allOf recursively
    if (schema.allOf) {
      const nestedMerged = mergeAllOfSchemas(schema.allOf)
      mergeSchemaIntoResult(result, nestedMerged)
      continue
    }

    mergeSchemaIntoResult(result, schema)
  }

  // Process root schema last if provided
  if (rootSchema && typeof rootSchema === 'object') {
    if (rootSchema.allOf) {
      const nestedMerged = mergeAllOfSchemas(rootSchema.allOf)
      mergeSchemaIntoResult(result, nestedMerged)
    } else {
      mergeSchemaIntoResult(result, rootSchema)
    }
  }

  return result
}

/**
 * Efficiently merges a source schema into a target result object.
 * Handles all schema merging logic in a single optimized function.
 */
const mergeSchemaIntoResult = (result: SchemaObject, schema: SchemaObject): void => {
  // Early return if schema is empty
  const schemaKeys = objectKeys(schema)
  if (schemaKeys.length === 0) {
    return
  }

  // Loop through all schema properties and handle them appropriately
  for (const key of schemaKeys) {
    const value = getResolvedRef(schema[key])

    if (value === undefined) {
      continue
    }

    // Required
    if (key === 'required') {
      // Merge required fields with deduplication
      if (Array.isArray(value) && value.length > 0) {
        if (result.required?.length) {
          result.required = [...new Set([...result.required, ...value])]
        } else {
          result.required = value.slice()
        }
      }
    }
    // Properties
    else if (key === 'properties') {
      // Merge properties recursively
      if (value && typeof value === 'object') {
        if (!result.properties) {
          result.properties = {}
        }
        mergePropertiesIntoResult(result.properties, value)
      }
    }
    // Items
    else if (key === 'items') {
      // Handle items (for both arrays and objects with items)
      const items = getResolvedRef(value)
      if (items) {
        if (schema.type === 'array') {
          if (!result.items) {
            result.items = {} as SchemaObject
          }

          // Handle allOf within array items
          if (items.allOf) {
            const mergedItems = mergeAllOfSchemas(items.allOf)
            Object.assign(result.items, mergedItems)
          } else {
            mergeItemsIntoResult(getResolvedRef(result.items), items)
          }
        }
        // For non-array types with items.allOf, merge into properties
        else if (items.allOf) {
          const mergedItems = mergeAllOfSchemas(items.allOf)
          if (mergedItems.properties) {
            if (!result.properties) {
              result.properties = {}
            }
            mergePropertiesIntoResult(result.properties, mergedItems.properties)
          }
        }
      }
    }
    // Enum
    else if (key === 'enum') {
      if (Array.isArray(value) && value.length > 0) {
        result.enum = [...new Set([...(result.enum || []), ...value])]
      }
    }
    // OneOf/AnyOf
    else if (key === 'oneOf' || key === 'anyOf') {
      // Merge oneOf/anyOf subschemas
      if (Array.isArray(value)) {
        if (!result.properties) {
          result.properties = {}
        }
        for (const _option of value) {
          const option = getResolvedRef(_option)
          if (option.properties) {
            mergePropertiesIntoResult(result.properties, option.properties)
          }
        }
      }
    }
    // Skip allOf as it's handled at a higher level
    else if (key === 'allOf') {
      continue
    }
    // For all other properties, preserve the first occurrence
    else {
      if (key === 'x-additional-properties-name') {
        console.log('key', key, value)
      }
      result[key] ??= value
    }
  }
}

/**
 * Efficiently merges properties into a result object without creating new objects.
 */
const mergePropertiesIntoResult = (
  result: SchemaObject['properties'],
  properties: SchemaObject['properties'],
): void => {
  const propertyKeys = Object.keys(properties ?? {})
  if (!properties || !result || propertyKeys.length === 0) {
    return
  }

  for (const key of propertyKeys) {
    const schema = getResolvedRef(properties[key])

    if (!schema || typeof schema !== 'object') {
      result[key] = schema
      continue
    }

    if (!result[key]) {
      // Handle new property with allOf
      if (schema.allOf) {
        result[key] = mergeAllOfSchemas(schema.allOf)
      } else if (schema.type === 'array' && getResolvedRef(schema.items)?.allOf) {
        result[key] = {
          ...schema,
          items: mergeAllOfSchemas(getResolvedRef(schema.items)?.allOf),
        }
      } else {
        result[key] = properties[key]
      }
      continue
    }

    // Merge existing property
    const existing = getResolvedRef(result[key])

    if (schema.allOf) {
      result[key] = mergeAllOfSchemas([existing, ...schema.allOf], undefined)
    } else if (schema.type === 'array' && schema.items) {
      const existingItems = getResolvedRef(existing.items)
      result[key] = {
        ...existing,
        type: 'array',
        items: existingItems ? mergeItems(existingItems, getResolvedRef(schema.items)) : getResolvedRef(schema.items),
      }
    } else {
      // Create merged object with properties handled separately
      if (existing.properties && schema.properties) {
        const merged = { ...existing, ...schema }
        merged.properties = { ...existing.properties }
        mergePropertiesIntoResult(merged.properties, schema.properties)
        result[key] = merged
      }
      // Simple merge without property recursion
      else {
        result[key] = { ...schema, ...existing }
      }
    }
  }
}

/**
 * Efficiently merges array items into a result object.
 */
const mergeItemsIntoResult = (result: SchemaObject, items: SchemaObject): void => {
  // Handle allOf in items
  if (items.allOf || result.allOf) {
    // Build array without spreads for better performance
    const allOfSchemas: SchemaObject[] = []

    if (result.allOf) {
      for (const schema of result.allOf) {
        allOfSchemas.push(getResolvedRef(schema))
      }
    } else {
      allOfSchemas.push(result)
    }

    if (items.allOf) {
      for (const schema of items.allOf) {
        allOfSchemas.push(getResolvedRef(schema))
      }
    } else {
      allOfSchemas.push(items)
    }

    const merged = mergeAllOfSchemas(allOfSchemas, undefined)
    Object.assign(result, merged)
    return
  }

  // Regular merge
  Object.assign(result, items)

  // Merge properties if both have them
  if (result.properties && items.properties) {
    mergePropertiesIntoResult(result.properties, items.properties)
  }
}

/**
 * Helper function for merging items that returns a new object.
 */
const mergeItems = (existing: SchemaObject, incoming: SchemaObject): SchemaObject => {
  // Handle allOf in either schema
  if (existing.allOf || incoming.allOf) {
    // Build array without spreads for better performance
    const allOfSchemas: SchemaObject[] = []

    if (existing.allOf) {
      for (const schema of existing.allOf) {
        allOfSchemas.push(getResolvedRef(schema))
      }
    } else {
      allOfSchemas.push(existing)
    }

    if (incoming.allOf) {
      for (const schema of incoming.allOf) {
        allOfSchemas.push(getResolvedRef(schema))
      }
    } else {
      allOfSchemas.push(incoming)
    }

    return mergeAllOfSchemas(allOfSchemas, undefined)
  }

  const merged = { ...existing, ...incoming }

  // Recursively merge properties if both have properties
  if (existing.properties && incoming.properties) {
    merged.properties = { ...existing.properties }
    mergePropertiesIntoResult(merged.properties, incoming.properties)
  }

  return merged
}
