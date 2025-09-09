import { objectKeys } from '@scalar/helpers/object/object-keys'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/**
 * Merges multiple OpenAPI schema objects into a single schema object.
 * Handles nested allOf compositions and merges properties recursively.
 *
 * @param schemas - Array of OpenAPI schema objects to merge
 * @param rootSchema - Optional root schema to merge with the result
 * @returns Merged schema object
 */
export const mergeAllOfSchemas = (schemas: SchemaObject | undefined, rootSchema?: SchemaObject): SchemaObject => {
  // Handle max depth, empty or invalid input
  if (!schemas?.allOf?.length || !Array.isArray(schemas.allOf)) {
    return rootSchema || ({} as SchemaObject)
  }

  // Initialize result object once
  const result = {} as SchemaObject

  // Extract base schema properties (everything except allOf)
  const { allOf: _, ...baseSchema } = schemas

  // Process allOf schemas first
  for (const _schema of schemas.allOf) {
    if (!_schema || typeof _schema !== 'object') {
      continue
    }

    // Resolve ref if present
    const schema = getResolvedRef(_schema)

    // Handle nested allOf recursively
    if (schema.allOf) {
      const nestedMerged = mergeAllOfSchemas(schema)
      mergeSchemaIntoResult(result, nestedMerged)
      continue
    }

    mergeSchemaIntoResult(result, schema)
  }

  // Apply base schema properties with precedence over allOf properties
  if (Object.keys(baseSchema).length > 0) {
    mergeSchemaIntoResult(result, baseSchema, true)
  }

  // Process root schema last if provided
  if (rootSchema && typeof rootSchema === 'object') {
    if (rootSchema.allOf) {
      const nestedMerged = mergeAllOfSchemas(rootSchema)
      mergeSchemaIntoResult(result, nestedMerged, true)
    } else {
      mergeSchemaIntoResult(result, rootSchema, true)
    }
  }

  return result
}

/**
 * Efficiently merges a source schema into a target result object.
 * Handles all schema merging logic in a single optimized function.
 *
 * @param result - The target schema object to merge into
 * @param schema - The source schema object to merge from
 * @param override - Whether to override existing properties (default: false)
 */
const mergeSchemaIntoResult = (result: SchemaObject, schema: SchemaObject, override: boolean = false): void => {
  // Early return if schema is empty
  const schemaKeys = objectKeys(schema)
  if (schemaKeys.length === 0) {
    return
  }

  // Loop through all schema properties and handle them appropriately
  for (const key of schemaKeys) {
    const value = getResolvedRef(schema[key]) as SchemaObject

    if (value === undefined) {
      continue
    }

    // Required
    if ((key as string) === 'required') {
      // Merge required fields with deduplication
      if (Array.isArray(value) && value.length > 0) {
        // @ts-ignore
        if (result.required?.length) {
          // @ts-ignore
          result.required = [...new Set([...result.required, ...value])]
        } else {
          // @ts-ignore
          result.required = value.slice()
        }
      }
    }
    // Properties
    else if ((key as string) === 'properties') {
      // Merge properties recursively
      if (value && typeof value === 'object') {
        // @ts-ignore
        if (!result.properties) {
          // @ts-ignore
          result.properties = {}
        }

        // @ts-ignore
        mergePropertiesIntoResult(result.properties, value)
      }
    }
    // Items
    else if ((key as string) === 'items') {
      // Handle items (for both arrays and objects with items)
      const items = getResolvedRef(value)
      if (items) {
        if (isArraySchema(schema)) {
          // @ts-ignore
          if (!result.items) {
            // @ts-ignore
            result.items = {}
          }

          // Handle allOf within array items
          if (items.allOf) {
            const mergedItems = mergeAllOfSchemas(items)
            // @ts-ignore
            Object.assign(result.items, mergedItems)
          } else {
            // @ts-ignore
            mergeItemsIntoResult(getResolvedRef(result.items), items)
          }
        }
        // For non-array types with items.allOf, merge into properties
        else if (items.allOf) {
          const mergedItems = mergeAllOfSchemas(items)
          if ('properties' in mergedItems) {
            if (!('properties' in result)) {
              // @ts-ignore
              result.properties = {}
            }

            'properties' in result && mergePropertiesIntoResult(result.properties, mergedItems.properties)
          }
        }
        // For non-array types without allOf, still set items if not already set
        else if (!('items' in result)) {
          // @ts-ignore
          result.items = items
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
      // Merge oneOf/anyOf subschema
      if (Array.isArray(value)) {
        if (!('properties' in result)) {
          // @ts-ignore
          result.properties = {}
        }
        for (const _option of value) {
          const option = getResolvedRef(_option)
          if (option.properties && 'properties' in result) {
            mergePropertiesIntoResult(result.properties, option.properties)
          }
        }
      }
    }
    // Skip allOf as it's handled at a higher level
    else if (key === 'allOf') {
      continue
    }
    // For all other properties, preserve the first occurrence or override if specified
    else {
      if (override || result[key] === undefined) {
        // @ts-ignore
        result[key] = value
      }
    }
  }
}

/**
 * Efficiently merges properties into a result object without creating new objects.
 */
const mergePropertiesIntoResult = (
  result: Extract<SchemaObject, { type: 'object' }>['properties'],
  properties: Extract<SchemaObject, { type: 'object' }>['properties'],
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
        result[key] = mergeAllOfSchemas(schema)
      } else if ('type' in schema && schema.type === 'array' && getResolvedRef(schema.items)?.allOf) {
        result[key] = {
          ...schema,
          items: mergeAllOfSchemas(getResolvedRef(schema.items)),
        }
      } else {
        result[key] = properties[key]
      }
      continue
    }

    // Merge existing property
    const existing = getResolvedRef(result[key])

    if (schema.allOf) {
      result[key] = mergeAllOfSchemas({ allOf: [existing, ...schema.allOf] } as SchemaObject)
    } else if (isArraySchema(schema) && isArraySchema(existing) && schema.items) {
      const existingItems = getResolvedRef(existing.items)
      result[key] = {
        ...existing,
        type: 'array',
        items: existingItems ? mergeItems(existingItems, getResolvedRef(schema.items)) : getResolvedRef(schema.items),
      }
    } else {
      // Create merged object with properties handled separately
      if ('properties' in existing && 'properties' in schema) {
        const merged = { ...existing, ...schema }
        merged.properties = { ...existing.properties }
        mergePropertiesIntoResult(merged.properties, schema.properties)
        result[key] = merged
      }
      // Simple merge without property recursion
      else {
        // @ts-ignore
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

    const merged = mergeAllOfSchemas({ allOf: allOfSchemas } as SchemaObject)
    Object.assign(result, merged)
    return
  }

  // Regular merge
  Object.assign(result, items)

  // Merge properties if both have them
  if ('properties' in result && 'properties' in items) {
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

    return mergeAllOfSchemas({ allOf: allOfSchemas } as SchemaObject)
  }

  const merged = { ...existing, ...incoming }

  // Recursively merge properties if both have properties
  if ('properties' in existing && 'properties' in incoming) {
    // @ts-ignore
    merged.properties = { ...existing.properties }
    // @ts-ignore
    mergePropertiesIntoResult(merged.properties, incoming.properties)
  }

  return merged as SchemaObject
}
