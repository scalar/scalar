import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/**
 * Recursively extracts examples from a schema object and its nested properties
 * @param schema - The schema object to extract examples from
 * @param depth - Current recursion depth to prevent infinite loops
 * @returns The extracted example or undefined if none found
 */
export const schemaToExample = (schema: SchemaObject | undefined, depth = 0): unknown => {
  // Prevent infinite recursion and handle invalid inputs
  if (!schema || depth > 10) {
    return undefined
  }

  // If the schema has examples array, return the first one
  if (schema.examples?.[0] !== undefined) {
    return schema.examples[0]
  }

  // If the schema has a single example property, return it
  if (schema.example !== undefined) {
    return schema.example
  }

  // String formats
  if (schema.type === 'string') {
    switch (schema.format) {
      case 'date':
        return '1985-10-26'
      case 'date-time':
        return '1985-10-26T01:21:00Z'
      case 'password':
        return 'xxxxxxx'
      case 'byte':
        return 'QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT'
      case 'binary':
        return '[binary data]'
      default:
        return ''
    }
  }

  // For number return 0
  if (schema.type === 'number' || schema.type === 'integer') {
    return 0
  }

  // For boolean return false
  if (schema.type === 'boolean') {
    return false
  }

  // For objects, recursively process properties
  if (schema.type === 'object' && schema.properties) {
    const result: Record<string, unknown> = {}
    let hasExamples = false

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const example = schemaToExample(propSchema, depth + 1)
      if (example !== undefined) {
        result[key] = example
        hasExamples = true
      }
    }

    return hasExamples ? result : undefined
  }

  // For arrays, process the items schema
  if (schema.type === 'array' && schema.items) {
    const itemExample = schemaToExample(schema.items as SchemaObject, depth + 1)
    return itemExample !== undefined ? [itemExample] : undefined
  }

  return undefined
}
